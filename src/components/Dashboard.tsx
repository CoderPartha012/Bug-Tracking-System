import React, { useState, useMemo, useEffect } from 'react';
import { useBugs } from '../context/BugContext';
import { useTheme } from '../context/ThemeContext';
import {
  AlertCircle, Clock, CheckCircle2, Bug as BugIcon,
  User, TrendingUp, Activity, Edit2, CalendarDays,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, PieChart, Pie, Cell,
  BarChart, Bar, ResponsiveContainer, LabelList,
} from 'recharts';
import type { Bug } from '../types/bug';
import { Tooltip } from './Tooltip';

// ── Shared color system ───────────────────────────────────────────────────────

const C = {
  high:       '#FF4D4D',
  medium:     '#FFA500',
  low:        '#00C853',
  open:       '#4D94FF',
  inProgress: '#FFA500',
  closed:     '#00C853',
} as const;

// ── Constants ─────────────────────────────────────────────────────────────────

const MY_USER_KEY = 'bug-tracker-username';
const DAY_MS = 86_400_000;

// ── Data helpers ──────────────────────────────────────────────────────────────

function getWeekStart(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function buildWeeklyTrend(bugs: Bug[], count = 8) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const ws = getWeekStart(new Date(+now - (count - 1 - i) * 7 * DAY_MS));
    const we = new Date(+ws + 7 * DAY_MS);
    const opened = bugs.filter(b => { const d = new Date(b.createdAt); return d >= ws && d < we; }).length;
    const closed = bugs.filter(b => {
      if (b.status !== 'closed') return false;
      const d = new Date(b.updatedAt); return d >= ws && d < we;
    }).length;
    return { week: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Opened: opened, Closed: closed };
  });
}

function buildHeatmap(bugs: Bug[], totalDays = 91) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(+today - (today.getDay() + totalDays - 7) * DAY_MS);
  const map: Record<string, number> = {};
  bugs.forEach(b => {
    [b.createdAt, b.updatedAt].forEach(ts => {
      if (ts) { const k = ts.slice(0, 10); map[k] = (map[k] ?? 0) + 1; }
    });
  });
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(+start + i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    return { date: d, key, count: map[key] ?? 0 };
  });
}

function heatBg(count: number) {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-700/60';
  if (count === 1) return 'bg-blue-200 dark:bg-blue-900';
  if (count <= 3) return 'bg-blue-400 dark:bg-blue-700';
  if (count <= 6) return 'bg-blue-600 dark:bg-blue-500';
  return 'bg-blue-800 dark:bg-blue-400';
}

// ── Count-up animation ────────────────────────────────────────────────────────

function CountUpNumber({ target, className }: { target: number; className?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let raf: number;
    let startTs: number | null = null;
    const duration = 750;
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span className={className}>{val}</span>;
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        rounded-xl border border-slate-200 dark:border-slate-700
        shadow-sm
        hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon, iconBg, iconColor, title, right,
}: {
  icon: React.ElementType; iconBg: string; iconColor: string;
  title: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-1.5 rounded-lg ${iconBg}`}>
        <Icon size={14} className={iconColor} />
      </div>
      <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </h2>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

// ── My Bugs Widget ────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  open:         'bg-red-500',
  'in-progress':'bg-amber-500',
  closed:       'bg-emerald-500',
};

function MyBugsWidget({ bugs, onEdit }: { bugs: Bug[]; onEdit?: (bug: Bug) => void }) {
  const [userName, setUserName] = useState(() => localStorage.getItem(MY_USER_KEY) ?? '');
  const [editing, setEditing]   = useState(() => !localStorage.getItem(MY_USER_KEY));
  const [inputVal, setInputVal] = useState(() => localStorage.getItem(MY_USER_KEY) ?? '');

  const saveName = () => {
    const v = inputVal.trim();
    if (!v) return;
    localStorage.setItem(MY_USER_KEY, v);
    setUserName(v);
    setEditing(false);
  };

  const myBugs = userName
    ? bugs.filter(b => b.assignedTo.toLowerCase().includes(userName.toLowerCase()))
    : [];

  return (
    <Card className="p-5 flex flex-col min-h-[240px]">
      <CardHeader
        icon={User}
        iconBg="bg-indigo-50 dark:bg-indigo-900/40"
        iconColor="text-indigo-600 dark:text-indigo-400"
        title="My Bugs"
        right={
          !editing && userName ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
            >
              {userName}
            </button>
          ) : undefined
        }
      />

      {editing ? (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Enter your name to see your assigned bugs:</p>
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
            placeholder="e.g. Alice"
            className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="button"
            onClick={saveName}
            disabled={!inputVal.trim()}
            className="w-full py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            Set Name
          </button>
        </div>
      ) : myBugs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <CheckCircle2 size={30} className="text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">All clear!</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No bugs assigned to {userName}</p>
        </div>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto max-h-52">
          {myBugs.map(bug => (
            <div
              key={bug.id}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors"
            >
              <Tooltip text={`Status: ${bug.status}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[bug.status] ?? 'bg-slate-400'}`} />
              </Tooltip>
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{bug.title}</span>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(bug)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded"
                  aria-label="Edit bug"
                >
                  <Edit2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!editing && userName && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>{myBugs.length} assigned</span>
          <span>
            {myBugs.filter(b => b.status === 'open').length} open ·{' '}
            {myBugs.filter(b => b.status === 'in-progress').length} in progress
          </span>
        </div>
      )}
    </Card>
  );
}

// ── Severity Progress Bars ────────────────────────────────────────────────────

function SeverityProgressBars({ bugs }: { bugs: Bug[] }) {
  const total = bugs.length;

  const bars = [
    {
      label: 'High',
      count: bugs.filter(b => b.severity === 'high').length,
      fillClass: 'bg-red-500',
      textClass: 'text-red-500',
      summaryColor: C.high,
      tooltip: 'Bugs requiring immediate attention',
    },
    {
      label: 'Medium',
      count: bugs.filter(b => b.severity === 'medium').length,
      fillClass: 'bg-amber-500',
      textClass: 'text-amber-500',
      summaryColor: C.medium,
      tooltip: 'Bugs that should be addressed soon',
    },
    {
      label: 'Low',
      count: bugs.filter(b => b.severity === 'low').length,
      fillClass: 'bg-emerald-500',
      textClass: 'text-emerald-500',
      summaryColor: C.low,
      tooltip: 'Minor issues with low urgency',
    },
  ];

  return (
    <Card className="p-5 flex flex-col min-h-[240px]">
      <CardHeader
        icon={Activity}
        iconBg="bg-orange-50 dark:bg-orange-900/40"
        iconColor="text-orange-500 dark:text-orange-400"
        title="Severity Breakdown"
      />

      {total === 0 ? (
        <div className="flex-1 space-y-5">
          {bars.map(({ label }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">0 · 0%</span>
              </div>
              {/* Empty dashed bar when no data */}
              <div className="h-3 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 space-y-5">
          {bars.map(({ label, count, fillClass, textClass, tooltip }) => {
            const pct = (count / total) * 100;
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <Tooltip text={tooltip}>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-default">
                      {label}
                    </span>
                  </Tooltip>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold tabular-nums ${textClass}`}>{count}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums w-8 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Neutral track; fill width driven by safelist w-[X%] classes */}
                <div className="h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out w-[${Math.round(pct)}%] ${count > 0 ? fillClass : ''}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 text-center gap-2">
        {bars.map(({ label, count, textClass }) => (
          <div key={label}>
            <p className={`text-lg font-bold tabular-nums ${textClass}`}>{count}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Weekly Trend Chart ────────────────────────────────────────────────────────

function WeeklyTrendChart({ data }: { data: { week: string; Opened: number; Closed: number }[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor   = isDark ? '#334155' : '#cbd5e1';
  const tickColor   = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    fontSize: 12, borderRadius: 8,
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
  };

  return (
    <Card className="p-5 flex flex-col min-h-[240px]">
      <CardHeader
        icon={TrendingUp}
        iconBg="bg-blue-50 dark:bg-blue-900/40"
        iconColor="text-blue-600 dark:text-blue-400"
        title="Weekly Trend"
      />
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={185}>
          <LineChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <ReTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="Opened"
              stroke={C.open}
              strokeWidth={3}
              dot={{ r: 4, fill: C.open, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="Closed"
              stroke={C.closed}
              strokeWidth={3}
              dot={{ r: 4, fill: C.closed, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ── Status Pie Chart ──────────────────────────────────────────────────────────

function StatusPieChart({ statusStats }: { statusStats: Record<string, number> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const total = Object.values(statusStats).reduce((a, b) => a + b, 0);

  const rows = [
    { key: 'open',        label: 'Open',        value: statusStats.open,          color: C.open,       bgClass: 'bg-blue-400'    },
    { key: 'in-progress', label: 'In Progress',  value: statusStats['in-progress'], color: C.inProgress, bgClass: 'bg-amber-500'   },
    { key: 'closed',      label: 'Closed',       value: statusStats.closed,         color: C.closed,     bgClass: 'bg-emerald-400' },
  ];

  // Filter zero-value slices so recharts doesn't render phantom arcs
  const pieData = rows.filter(r => r.value > 0);

  const tooltipStyle = {
    fontSize: 12, borderRadius: 8,
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
  };

  return (
    <Card className="p-6">
      <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
        Status Distribution
      </h2>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <AlertCircle size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No bugs logged yet</p>
        </div>
      ) : (
        <>
          {/* Donut chart with centre total */}
          <div className="relative flex justify-center">
            <PieChart width={220} height={180}>
              <Pie
                data={pieData}
                cx={110} cy={90}
                innerRadius={52}
                outerRadius={82}
                paddingAngle={pieData.length > 1 ? 3 : 0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {pieData.map(entry => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [value, name]}
              />
            </PieChart>
            {/* Centre total overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <CountUpNumber
                target={total}
                className="text-2xl font-bold text-slate-900 dark:text-white leading-none"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 space-y-2">
            {rows.map(({ key, label, value, bgClass }) => (
              <div key={key} className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${bgClass}`} />
                <span className="flex-1 text-xs text-slate-600 dark:text-slate-400">{label}</span>
                <span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">{value}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums w-9 text-right">
                  {total > 0 ? `${((value / total) * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Severity Bar Chart ────────────────────────────────────────────────────────

// Custom bar-top label — uses Tailwind SVG fill classes, no inline style
function BarLabel(props: unknown) {
  const p = props as { x?: number; y?: number; width?: number; value?: number };
  if (p.x === undefined || p.y === undefined || p.width === undefined) return null;
  return (
    <text
      x={p.x + p.width / 2}
      y={p.y - 5}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      className="fill-slate-600 dark:fill-slate-400"
    >
      {p.value}
    </text>
  );
}

function SeverityBarChart({ severityData }: { severityData: { name: string; value: number }[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor  = isDark ? '#334155' : '#cbd5e1';
  const tickColor  = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    fontSize: 12, borderRadius: 8,
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
  };

  const barColors: Record<string, string> = {
    high:   C.high,
    medium: C.medium,
    low:    C.low,
  };

  return (
    <Card className="p-6">
      <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
        Severity Distribution
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={severityData}
          margin={{ top: 20, right: 8, left: -16, bottom: 0 }}
          barCategoryGap="40%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <ReTooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, _: string, entry: { payload?: { name?: string } }) => [
              v, entry.payload?.name ? entry.payload.name.charAt(0).toUpperCase() + entry.payload.name.slice(1) : v,
            ]}
          />
          <Bar
            dataKey="value"
            maxBarSize={52}
            radius={[6, 6, 0, 0]}
            minPointSize={3}
            name="Bugs"
          >
            {severityData.map(entry => (
              <Cell key={entry.name} fill={barColors[entry.name] ?? '#94a3b8'} />
            ))}
            <LabelList dataKey="value" content={BarLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Calendar Heatmap ──────────────────────────────────────────────────────────

type HeatDay = { date: Date; key: string; count: number };

function CalendarHeatmap({ days }: { days: HeatDay[] }) {
  const weeks: HeatDay[][] = Array.from({ length: 13 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0]?.date.getMonth() ?? -1;
    if (m !== lastMonth) {
      monthLabels.push({ col: wi, label: week[0]?.date.toLocaleDateString('en-US', { month: 'short' }) ?? '' });
      lastMonth = m;
    }
  });

  const DAY_LABELS    = ['', 'M', '', 'W', '', 'F', ''];
  const totalActivity = days.reduce((s, d) => s + d.count, 0);
  const activeDays    = days.filter(d => d.count > 0).length;
  const LEGEND_LEVELS: [number, string][] = [
    [0, 'No activity'], [1, '1 activity'], [2, '2–3 activities'], [4, '4–6 activities'], [7, '7+ activities'],
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <CardHeader
          icon={CalendarDays}
          iconBg="bg-violet-50 dark:bg-violet-900/40"
          iconColor="text-violet-600 dark:text-violet-400"
          title="Activity Heatmap"
        />
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
          {totalActivity} activities · {activeDays} active days
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-[3px]">
          <div className="flex gap-[3px]">
            <div className="w-5 flex-shrink-0" />
            {weeks.map((week, wi) => {
              const ml = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} className="w-[14px] relative overflow-visible">
                  {ml && (
                    <span className="absolute left-0 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {ml.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {DAY_LABELS.map((dayLabel, ri) => (
            <div key={ri} className="flex items-center gap-[3px]">
              <span className="w-5 text-right text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 pr-0.5">
                {dayLabel}
              </span>
              {weeks.map((week, wi) => {
                const cell = week[ri];
                if (!cell) return <div key={wi} className="w-[14px] h-[14px]" />;
                const label = cell.count === 0
                  ? `${cell.key}: no activity`
                  : `${cell.key}: ${cell.count} ${cell.count === 1 ? 'activity' : 'activities'}`;
                return (
                  <Tooltip key={wi} text={label} position="top">
                    <div className={`w-[14px] h-[14px] rounded-[3px] cursor-default transition-colors ${heatBg(cell.count)}`} />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-4 justify-end flex-wrap">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Less</span>
        {LEGEND_LEVELS.map(([val, label]) => (
          <Tooltip key={val} text={label} position="top">
            <div className={`w-[14px] h-[14px] rounded-[3px] cursor-default ${heatBg(val)}`} />
          </Tooltip>
        ))}
        <span className="text-[10px] text-slate-400 dark:text-slate-500">More</span>
      </div>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

interface DashboardProps {
  onEdit?: (bug: Bug) => void;
}

export function Dashboard({ onEdit }: DashboardProps) {
  const { state } = useBugs();
  const { bugs }  = state;

  const statusStats = {
    open:          bugs.filter(b => b.status === 'open').length,
    'in-progress': bugs.filter(b => b.status === 'in-progress').length,
    closed:        bugs.filter(b => b.status === 'closed').length,
  };

  const severityData = [
    { name: 'high',   value: bugs.filter(b => b.severity === 'high').length },
    { name: 'medium', value: bugs.filter(b => b.severity === 'medium').length },
    { name: 'low',    value: bugs.filter(b => b.severity === 'low').length },
  ];

  const weeklyTrend = useMemo(() => buildWeeklyTrend(bugs), [bugs]);
  const heatmapDays = useMemo(() => buildHeatmap(bugs), [bugs]);

  const statCards = [
    { label: 'Total Bugs',  value: bugs.length,               icon: BugIcon,      iconColor: 'text-blue-600',    iconBg: 'bg-blue-100 dark:bg-blue-900/40',    border: 'border-blue-100 dark:border-blue-900/50',    bg: 'bg-blue-50/60 dark:bg-blue-950/30'    },
    { label: 'Open',        value: statusStats.open,           icon: AlertCircle,  iconColor: 'text-red-500',     iconBg: 'bg-red-100 dark:bg-red-900/40',      border: 'border-red-100 dark:border-red-900/50',      bg: 'bg-red-50/60 dark:bg-red-950/30'      },
    { label: 'In Progress', value: statusStats['in-progress'], icon: Clock,        iconColor: 'text-amber-500',   iconBg: 'bg-amber-100 dark:bg-amber-900/40',  border: 'border-amber-100 dark:border-amber-900/50',  bg: 'bg-amber-50/60 dark:bg-amber-950/30'  },
    { label: 'Closed',      value: statusStats.closed,         icon: CheckCircle2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-100 dark:border-emerald-900/50', bg: 'bg-emerald-50/60 dark:bg-emerald-950/30' },
  ];

  return (
    <div className="mb-8 space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconColor, iconBg, border, bg }) => (
          <div
            key={label}
            className={`
              rounded-xl border ${border} ${bg} p-4 flex items-center gap-4
              hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-default
            `}
          >
            <div className={`p-2.5 rounded-lg ${iconBg} flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <CountUpNumber
                target={value}
                className="text-2xl font-bold text-slate-900 dark:text-white leading-none block"
              />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── My Bugs · Severity Bars · Trend Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <MyBugsWidget bugs={bugs} onEdit={onEdit} />
        <SeverityProgressBars bugs={bugs} />
        <WeeklyTrendChart data={weeklyTrend} />
      </div>

      {/* ── Status Pie · Severity Bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StatusPieChart statusStats={statusStats} />
        <SeverityBarChart severityData={severityData} />
      </div>

      {/* ── Calendar Heatmap ── */}
      <CalendarHeatmap days={heatmapDays} />

    </div>
  );
}
