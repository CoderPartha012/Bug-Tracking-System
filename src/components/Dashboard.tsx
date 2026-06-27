import React, { useState, useMemo, useEffect } from 'react';
import { useBugs } from '../context/BugContext';
import { useTheme } from '../context/ThemeContext';
import {
  AlertCircle, Clock, CheckCircle2, Bug as BugIcon,
  User, TrendingUp, Activity, Edit2, BarChart2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, PieChart, Pie, Cell,
  BarChart, Bar, ResponsiveContainer, LabelList,
} from 'recharts';
import type { Bug } from '../types/bug';
import { Tooltip } from './Tooltip';
import { STATUS_CONFIGS, STATUS_CONFIG_MAP } from '../lib/statusConfig';

// ── Shared color system ───────────────────────────────────────────────────────

const C = {
  high:       '#FF4D4D',
  medium:     '#FFA500',
  low:        '#00C853',
  // Status colors from spec
  new:        '#6B7280',
  open:       '#3B82F6',
  inProgress: '#EAB308',
  inReview:   '#8B5CF6',
  testing:    '#F97316',
  closed:     '#22C55E',
  rejected:   '#EF4444',
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
    const rejected = bugs.filter(b => {
      if (b.status !== 'rejected') return false;
      const d = new Date(b.updatedAt); return d >= ws && d < we;
    }).length;
    return {
      week: ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Opened: opened,
      Closed: closed,
      Rejected: rejected,
    };
  });
}

// ── Count-up animation ────────────────────────────────────────────────────────

function CountUpNumber({ target, className, style }: { target: number; className?: string; style?: React.CSSProperties }) {
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
  return <span className={className} style={style}>{val}</span>;
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

  const statusCounts = STATUS_CONFIGS.slice(0, 5).map(cfg => ({
    ...cfg,
    count: myBugs.filter(b => b.status === cfg.status).length,
  })).filter(s => s.count > 0);

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
          {myBugs.map(bug => {
            const cfg = STATUS_CONFIG_MAP[bug.status];
            return (
              <div
                key={bug.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors"
              >
                <Tooltip text={`Status: ${cfg?.label ?? bug.status}`}>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg?.color ?? '#94a3b8' }}
                  />
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
            );
          })}
        </div>
      )}

      {!editing && userName && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">{myBugs.length} assigned</span>
          </div>
          {statusCounts.length > 0 ? (
            <div className="flex items-center gap-2.5 flex-wrap">
              {statusCounts.map(s => (
                <span key={s.status} className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span style={{ color: s.color }} className="font-medium">{s.count}</span>
                  <span className="text-slate-400 dark:text-slate-500">{s.label}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">No active bugs</span>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Severity Progress Bars ────────────────────────────────────────────────────

function SeverityProgressBars({ bugs }: { bugs: Bug[] }) {
  const total = bugs.length;

  const bars = [
    { label: 'High',   count: bugs.filter(b => b.severity === 'high').length,   color: '#ef4444', bg: 'bg-red-500',     track: 'bg-red-100 dark:bg-red-950/60',   tooltip: 'Bugs requiring immediate attention' },
    { label: 'Medium', count: bugs.filter(b => b.severity === 'medium').length, color: '#f59e0b', bg: 'bg-amber-500',   track: 'bg-amber-100 dark:bg-amber-950/60', tooltip: 'Bugs that should be addressed soon' },
    { label: 'Low',    count: bugs.filter(b => b.severity === 'low').length,    color: '#22c55e', bg: 'bg-emerald-500', track: 'bg-emerald-100 dark:bg-emerald-950/60', tooltip: 'Minor issues with low urgency' },
  ];

  return (
    <Card className="p-5 flex flex-col min-h-[240px]">
      <CardHeader
        icon={Activity}
        iconBg="bg-orange-50 dark:bg-orange-900/40"
        iconColor="text-orange-500 dark:text-orange-400"
        title="Severity Breakdown"
        right={total > 0 ? <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">{total} bugs</span> : undefined}
      />

      <div className="flex-1 space-y-4">
        {bars.map(({ label, count, color, bg, track, tooltip }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-1.5">
                <Tooltip text={tooltip}>
                  <div className="flex items-center gap-2 cursor-default">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                  </div>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tabular-nums" style={{ color }}>{count}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums w-8 text-right font-medium">
                    {total > 0 ? `${pct.toFixed(0)}%` : '—'}
                  </span>
                </div>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${track}`}>
                {count === 0 ? (
                  <div className="h-full w-0" />
                ) : (
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${bg}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini donut-style ratio strip */}
      {total > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex rounded-full overflow-hidden h-2 mb-3">
            {bars.filter(b => b.count > 0).map(({ label, count, color }) => (
              <div
                key={label}
                className="h-full transition-all duration-700 ease-out"
                style={{ width: `${(count / total) * 100}%`, backgroundColor: color }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 text-center gap-1">
            {bars.map(({ label, count, color }) => (
              <div key={label}>
                <p className="text-base font-black tabular-nums" style={{ color }}>{count}</p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Weekly Trend Chart ────────────────────────────────────────────────────────

function WeeklyTrendChart({ data }: { data: { week: string; Opened: number; Closed: number; Rejected: number }[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  const LINES = [
    { key: 'Opened',   color: C.open,     width: 2.5, dash: undefined },
    { key: 'Closed',   color: C.closed,   width: 2.5, dash: undefined },
    { key: 'Rejected', color: C.rejected, width: 2,   dash: '5 3'    },
  ] as const;

  const totalOpened   = data.reduce((s, d) => s + d.Opened, 0);
  const totalClosed   = data.reduce((s, d) => s + d.Closed, 0);
  const totalRejected = data.reduce((s, d) => s + d.Rejected, 0);

  const renderTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="px-3 py-2.5 rounded-xl text-xs"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#fff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.15)',
        }}
      >
        <p className="font-semibold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-slate-600 dark:text-slate-300 w-14">{p.dataKey}</span>
            <span className="font-bold tabular-nums ml-auto" style={{ color: p.color }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
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
        <ResponsiveContainer width="100%" height={155}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              {LINES.map(({ key, color }) => (
                <linearGradient key={key} id={`wt-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={gridColor} strokeOpacity={1} vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
            <ReTooltip content={renderTooltip} cursor={{ stroke: isDark ? '#334155' : '#e2e8f0', strokeWidth: 1.5, strokeDasharray: '4 2' }} />
            {LINES.map(({ key, color, width, dash }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={width}
                strokeDasharray={dash}
                dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5.5, fill: color, stroke: isDark ? '#0f172a' : '#fff', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 text-center gap-1">
        {[
          { label: 'Opened',   value: totalOpened,   color: C.open },
          { label: 'Closed',   value: totalClosed,   color: C.closed },
          { label: 'Rejected', value: totalRejected, color: C.rejected },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-base font-black tabular-nums" style={{ color }}>{value}</p>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Status Pie Chart (7 slices) ───────────────────────────────────────────────

function StatusPieChart({ statusStats, total }: { statusStats: Record<string, number>; total: number }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const rows = STATUS_CONFIGS.map(cfg => ({
    key:   cfg.status,
    label: cfg.label,
    value: statusStats[cfg.status] ?? 0,
    color: cfg.color,
  }));
  const pieData = rows.filter(r => r.value > 0);

  const renderTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    const color = payload[0].payload.color;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    return (
      <div
        className="px-3 py-2.5 rounded-xl text-xs"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#fff',
          border: `1.5px solid ${color}40`,
          boxShadow: `0 8px 24px -4px ${color}30`,
        }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{name}</span>
        </div>
        <p className="text-xl font-black tabular-nums leading-none" style={{ color }}>{value}</p>
        <p className="text-slate-400 dark:text-slate-500 mt-1">{pct}% of total</p>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <CardHeader
        icon={CheckCircle2}
        iconBg="bg-sky-50 dark:bg-sky-900/40"
        iconColor="text-sky-500 dark:text-sky-400"
        title="Status Distribution"
        right={total > 0 ? <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">{total} total</span> : undefined}
      />

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <AlertCircle size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No bugs logged yet</p>
        </div>
      ) : (
        <div className="flex gap-5 items-center flex-wrap">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <PieChart width={190} height={170}>
              <defs>
                {pieData.map(entry => (
                  <radialGradient key={entry.key} id={`pie-grad-${entry.key}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor={entry.color} stopOpacity={1}    />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.75} />
                  </radialGradient>
                ))}
              </defs>
              <Pie
                data={pieData}
                cx={95} cy={85}
                innerRadius={46}
                outerRadius={78}
                paddingAngle={pieData.length > 1 ? 2 : 0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
                onMouseEnter={(_, idx) => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                {pieData.map((entry, idx) => (
                  <Cell
                    key={entry.key}
                    fill={`url(#pie-grad-${entry.key})`}
                    opacity={activeIdx === null || activeIdx === idx ? 1 : 0.45}
                    style={{ transition: 'opacity 0.2s, transform 0.2s', transformOrigin: '95px 85px', transform: activeIdx === idx ? 'scale(1.04)' : 'scale(1)', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <ReTooltip content={renderTooltip} />
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <CountUpNumber target={activeIdx !== null ? (pieData[activeIdx]?.value ?? total) : total} className="text-2xl font-black text-slate-900 dark:text-white leading-none" />
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {activeIdx !== null ? pieData[activeIdx]?.label : 'Total'}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 min-w-[130px] space-y-1.5">
            {rows.map(({ key, label, value, color }, idx) => {
              const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
              const isActive = activeIdx === pieData.findIndex(p => p.key === key);
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-150 cursor-default ${isActive ? 'bg-slate-100 dark:bg-slate-700/60' : ''}`}
                  onMouseEnter={() => setActiveIdx(pieData.findIndex(p => p.key === key))}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform" style={{ backgroundColor: color, transform: isActive ? 'scale(1.3)' : 'scale(1)' }} />
                  <span className={`flex-1 text-xs transition-colors ${isActive ? 'text-slate-800 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
                  <span className="text-xs font-black tabular-nums" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums w-7 text-right font-medium">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Status Breakdown Card (7 progress bars) ───────────────────────────────────

function StatusBreakdownCard({ statusStats, total }: { statusStats: Record<string, number>; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <Card className="p-6">
      <CardHeader
        icon={BarChart2}
        iconBg="bg-violet-50 dark:bg-violet-900/40"
        iconColor="text-violet-600 dark:text-violet-400"
        title="Status Breakdown"
        right={total > 0 ? <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">{total} bugs</span> : undefined}
      />

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
          <AlertCircle size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No bugs logged yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {STATUS_CONFIGS.map(cfg => {
              const count = statusStats[cfg.status] ?? 0;
              const pct   = total > 0 ? (count / total) * 100 : 0;
              const isHovered = hovered === cfg.status;
              return (
                <div
                  key={cfg.status}
                  className={`rounded-xl px-3 py-2 transition-all duration-150 cursor-default ${isHovered ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
                  onMouseEnter={() => setHovered(cfg.status)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-150"
                        style={{ backgroundColor: cfg.color, transform: isHovered ? 'scale(1.4)' : 'scale(1)' }}
                      />
                      <span className={`text-xs font-semibold transition-colors ${isHovered ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tabular-nums" style={{ color: cfg.color }}>{count}</span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums w-7 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700/80">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: count === 0 ? '0%' : `${pct}%`,
                        background: `linear-gradient(90deg, ${cfg.color}dd, ${cfg.color}88)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Distribution strip */}
          <div className="mt-4 flex rounded-full overflow-hidden h-1.5">
            {STATUS_CONFIGS.filter(cfg => (statusStats[cfg.status] ?? 0) > 0).map(cfg => (
              <div
                key={cfg.status}
                className="h-full transition-all duration-700 ease-out"
                style={{ width: `${((statusStats[cfg.status] ?? 0) / total) * 100}%`, backgroundColor: cfg.color }}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Severity Bar Chart ────────────────────────────────────────────────────────

const SEV_CFG = {
  high:   { label: 'High',   gradTop: '#ef4444', gradBot: '#fca5a5', chipBgLight: '#fee2e2', chipBgDark: '#3f0a0a' },
  medium: { label: 'Medium', gradTop: '#f59e0b', gradBot: '#fde68a', chipBgLight: '#fef3c7', chipBgDark: '#3d1c00' },
  low:    { label: 'Low',    gradTop: '#22c55e', gradBot: '#86efac', chipBgLight: '#dcfce7', chipBgDark: '#012d16' },
} as const;

type SevKey = keyof typeof SEV_CFG;

function SeverityBarChart({ severityData }: { severityData: { name: string; value: number }[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const total = severityData.reduce((s, d) => s + d.value, 0);

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  const renderTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) => {
    if (!active || !payload?.length) return null;
    const key = payload[0].payload.name as SevKey;
    const cfg = SEV_CFG[key];
    const val = payload[0].value;
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
    return (
      <div
        className="px-4 py-3 rounded-xl"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#fff',
          border: `1.5px solid ${cfg.gradTop}40`,
          boxShadow: `0 8px 24px -4px ${cfg.gradTop}30`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.gradTop }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: cfg.gradTop }}>{cfg.label} Severity</span>
        </div>
        <p className="text-3xl font-black tabular-nums leading-none" style={{ color: cfg.gradTop }}>{val}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{pct}% of all bugs</p>
      </div>
    );
  };

  const renderLabel = (props: unknown) => {
    const p = props as { x?: number; y?: number; width?: number; value?: number; payload?: { name: string } };
    if (!p.value || p.x === undefined || p.y === undefined || p.width === undefined) return null;
    const cfg = SEV_CFG[p.payload?.name as SevKey];
    return (
      <text
        x={p.x + p.width / 2}
        y={p.y - 10}
        textAnchor="middle"
        fontSize={15}
        fontWeight={900}
        fill={cfg?.gradTop ?? '#94a3b8'}
      >
        {p.value}
      </text>
    );
  };

  return (
    <Card className="p-6">
      <CardHeader
        icon={AlertCircle}
        iconBg="bg-rose-50 dark:bg-rose-900/40"
        iconColor="text-rose-500 dark:text-rose-400"
        title="Severity Distribution"
        right={
          total > 0
            ? <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">{total} bugs</span>
            : undefined
        }
      />

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <AlertCircle size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No bugs logged yet</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData} margin={{ top: 28, right: 12, left: -20, bottom: 0 }} barCategoryGap="44%">
              <defs>
                {(Object.keys(SEV_CFG) as SevKey[]).map(key => (
                  <linearGradient key={key} id={`sg-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={SEV_CFG[key].gradTop} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={SEV_CFG[key].gradBot} stopOpacity={0.70} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={gridColor} strokeOpacity={1} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: tickColor, fontWeight: 600 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
              />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ReTooltip
                content={renderTooltip}
                cursor={{ fill: isDark ? '#ffffff06' : '#00000005', radius: 8 }}
              />
              <Bar dataKey="value" maxBarSize={80} radius={[10, 10, 3, 3]} minPointSize={4}>
                {severityData.map(entry => (
                  <Cell key={entry.name} fill={`url(#sg-${entry.name})`} />
                ))}
                <LabelList dataKey="value" content={renderLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Severity stat chips */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {severityData.map(({ name, value }) => {
              const cfg = SEV_CFG[name as SevKey];
              if (!cfg) return null;
              const pct = Math.round((value / total) * 100);
              const chipBg = isDark ? cfg.chipBgDark : cfg.chipBgLight;
              return (
                <div
                  key={name}
                  className="rounded-xl p-3 text-center transition-transform hover:scale-105 duration-150 cursor-default"
                  style={{ backgroundColor: chipBg }}
                >
                  <CountUpNumber
                    target={value}
                    className="text-2xl font-black tabular-nums block leading-none"
                    style={{ color: cfg.gradTop }}
                  />
                  <p className="text-[11px] font-bold mt-1 uppercase tracking-wide" style={{ color: cfg.gradTop }}>
                    {cfg.label}
                  </p>
                  <p className="text-[10px] mt-0.5 font-semibold tabular-nums" style={{ color: cfg.gradTop, opacity: 0.65 }}>
                    {pct}%
                  </p>
                </div>
              );
            })}
          </div>

          {/* Proportional distribution strip */}
          <div className="mt-3 flex rounded-full overflow-hidden h-1.5">
            {severityData.filter(d => d.value > 0).map(({ name, value }) => (
              <div
                key={name}
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${(value / total) * 100}%`,
                  backgroundColor: SEV_CFG[name as SevKey]?.gradTop,
                }}
              />
            ))}
          </div>
        </>
      )}
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

  const statusStats = useMemo(() => {
    const result: Record<string, number> = {};
    STATUS_CONFIGS.forEach(cfg => {
      result[cfg.status] = bugs.filter(b => b.status === cfg.status).length;
    });
    return result;
  }, [bugs]);

  const total = bugs.length;

  const severityData = [
    { name: 'high',   value: bugs.filter(b => b.severity === 'high').length },
    { name: 'medium', value: bugs.filter(b => b.severity === 'medium').length },
    { name: 'low',    value: bugs.filter(b => b.severity === 'low').length },
  ];

  const weeklyTrend = useMemo(() => buildWeeklyTrend(bugs), [bugs]);

  const statCards = [
    { label: 'Total Bugs',   value: total,                      icon: BugIcon,      iconColor: 'text-blue-600',    iconBg: 'bg-blue-100 dark:bg-blue-900/40',       border: 'border-blue-100 dark:border-blue-900/50',    bg: 'bg-blue-50/60 dark:bg-blue-950/30'    },
    { label: 'Open',         value: statusStats['open'] ?? 0,   icon: AlertCircle,  iconColor: 'text-blue-500',    iconBg: 'bg-blue-100 dark:bg-blue-900/40',        border: 'border-blue-100 dark:border-blue-900/50',    bg: 'bg-blue-50/60 dark:bg-blue-950/30'    },
    { label: 'In Progress',  value: statusStats['in-progress'] ?? 0, icon: Clock,  iconColor: 'text-yellow-500',  iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',    border: 'border-yellow-100 dark:border-yellow-900/50', bg: 'bg-yellow-50/60 dark:bg-yellow-950/30'},
    { label: 'Closed',       value: statusStats['closed'] ?? 0, icon: CheckCircle2, iconColor: 'text-green-500',   iconBg: 'bg-green-100 dark:bg-green-900/40',     border: 'border-green-100 dark:border-green-900/50',  bg: 'bg-green-50/60 dark:bg-green-950/30'  },
  ];

  return (
    <div className="mb-8 space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, iconColor, iconBg, border, bg }) => (
          <div
            key={label}
            className={`rounded-xl border ${border} ${bg} p-4 flex items-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-default`}
          >
            <div className={`p-2.5 rounded-lg ${iconBg} flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <CountUpNumber target={value} className="text-2xl font-bold text-slate-900 dark:text-white leading-none block" />
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

      {/* ── Status Pie · Status Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StatusPieChart statusStats={statusStats} total={total} />
        <StatusBreakdownCard statusStats={statusStats} total={total} />
      </div>

      {/* ── Severity Bar ── */}
      <SeverityBarChart severityData={severityData} />

    </div>
  );
}
