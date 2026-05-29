import React, { useState } from 'react';
import { Bug, Status } from '../types/bug';
import { useBugs } from '../context/BugContext';
import { AlertTriangle, Trash2, Edit2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Comments } from './Comments';
import { ActivityLog } from './ActivityLog';
import { Tooltip } from './Tooltip';
import { ListSkeletons } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { ConfirmModal } from './ConfirmModal';
import {
  STATUS_CONFIGS, STATUS_CONFIG_MAP, LIFECYCLE_STAGES, getNextStatus,
} from '../lib/statusConfig';

interface BugListProps {
  onEdit: (bug: Bug) => void;
  onAddBug?: () => void;
}

const SEVERITY_BORDER: Record<string, string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-400',
  low:    'border-l-emerald-400',
};

const SEVERITY_TOOLTIP: Record<string, string> = {
  high:   'High severity — requires immediate attention',
  medium: 'Medium severity — should be addressed soon',
  low:    'Low severity — minor issue, low urgency',
};

function SeverityBadge({ severity }: { severity: string }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
  const map: Record<string, string> = {
    high:   `${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400`,
    medium: `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400`,
    low:    `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400`,
  };
  return (
    <Tooltip text={SEVERITY_TOOLTIP[severity] ?? severity}>
      <span className={map[severity] ?? base}><AlertTriangle size={11} /> {severity}</span>
    </Tooltip>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG_MAP[status as Status];
  if (!cfg) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{status}</span>;
  return (
    <Tooltip text={cfg.tooltip}>
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
        {cfg.label}
      </span>
    </Tooltip>
  );
}

// ── Distribution progress bar ─────────────────────────────────────────────────

function BugDistributionBar({ bugs }: { bugs: Bug[] }) {
  const total = bugs.length;
  if (total === 0) return null;

  const segments = STATUS_CONFIGS.map(cfg => ({
    ...cfg,
    count: bugs.filter(b => b.status === cfg.status).length,
  })).filter(s => s.count > 0);

  return (
    <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="h-3 flex rounded-full overflow-hidden gap-[2px]">
        {segments.map(s => (
          <Tooltip key={s.status} text={`${s.label}: ${s.count} (${((s.count / total) * 100).toFixed(0)}%)`}>
            <div
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
              style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map(s => (
          <span key={s.status} className="text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span style={{ color: s.color }} className="font-medium">{s.label}</span>
            <span className="text-slate-400 dark:text-slate-500">({s.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Filter tab bar ────────────────────────────────────────────────────────────

interface TabBarProps {
  bugs: Bug[];
  activeStatus: string;
  onSelect: (s: string) => void;
}

function StatusTabBar({ bugs, activeStatus, onSelect }: TabBarProps) {
  const tabs = [
    { key: 'all', label: 'All', count: bugs.length, color: '#64748b' },
    ...STATUS_CONFIGS.map(cfg => ({
      key: cfg.status,
      label: cfg.label,
      count: bugs.filter(b => b.status === cfg.status).length,
      color: cfg.color,
    })),
  ];

  return (
    <div className="flex overflow-x-auto gap-1.5 mb-4 pb-1 scrollbar-none">
      {tabs.map(tab => {
        const isActive = activeStatus === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
              isActive
                ? 'text-white shadow-sm border-transparent'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            style={isActive ? { backgroundColor: tab.color, borderColor: tab.color } : {}}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Status stepper (inside expanded panel) ────────────────────────────────────

function StatusStepper({ bug, onStatusChange }: { bug: Bug; onStatusChange: (s: Status) => void }) {
  const currentIdx = LIFECYCLE_STAGES.indexOf(bug.status as Status);
  const isRejected = bug.status === 'rejected';
  const nextStage  = isRejected ? null : getNextStatus(bug.status as Status);

  return (
    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Linear stages */}
      <div className="flex items-start overflow-x-auto pb-1 scrollbar-none">
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const cfg      = STATUS_CONFIG_MAP[stage];
          const isActive = stage === bug.status;
          const isPast   = !isRejected && currentIdx > idx;
          const isFuture = !isActive && !isPast;
          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center flex-shrink-0 min-w-[52px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${isActive ? 'scale-110 shadow-md' : ''}`}
                  style={{
                    backgroundColor: isActive || isPast ? cfg.color : 'transparent',
                    borderColor: isFuture ? '#cbd5e1' : cfg.color,
                    color: isActive || isPast ? 'white' : isFuture ? '#94a3b8' : cfg.color,
                  }}
                >
                  {isPast ? '✓' : idx + 1}
                </div>
                <span
                  className="text-[10px] mt-1 text-center leading-tight font-medium"
                  style={{ color: isFuture ? '#94a3b8' : isActive ? cfg.color : '#64748b' }}
                >
                  {cfg.label}
                </span>
              </div>
              {idx < LIFECYCLE_STAGES.length - 1 && (
                <div
                  className="h-0.5 flex-1 self-start mt-3.5 mx-1 rounded transition-all duration-500"
                  style={{ backgroundColor: isPast ? cfg.color : '#e2e8f0' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Rejected branch indicator */}
      {isRejected && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            Rejected — outside the linear workflow
          </span>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {nextStage && (
          <button
            type="button"
            onClick={() => onStatusChange(nextStage)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90 active:scale-95 shadow-sm"
            style={{ backgroundColor: STATUS_CONFIG_MAP[nextStage].color }}
          >
            Move to {STATUS_CONFIG_MAP[nextStage].label} <ArrowRight size={12} />
          </button>
        )}
        <select
          value={bug.status}
          onChange={e => onStatusChange(e.target.value as Status)}
          aria-label="Change bug status"
          title="Change bug status"
          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {STATUS_CONFIGS.map(cfg => (
            <option key={cfg.status} value={cfg.status}>{cfg.label}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 dark:text-slate-500">Change status</span>
      </div>
    </div>
  );
}

// ── Main BugList ──────────────────────────────────────────────────────────────

export function BugList({ onEdit, onAddBug }: BugListProps) {
  const { state, dispatch, loading, filteredBugs } = useBugs();
  const [expandedBug, setExpandedBug]         = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId]  = useState<string | null>(null);
  const [activeTab, setActiveTab]              = useState('all');

  if (loading) return <ListSkeletons count={4} />;

  const hasFiltersActive =
    state.filters.status !== 'all' ||
    state.filters.severity !== 'all' ||
    state.filters.assignedTo !== 'all' ||
    state.filters.search !== '';

  const handleTabSelect = (key: string) => {
    setActiveTab(key);
    dispatch({ type: 'SET_FILTERS', payload: { status: key } });
  };

  const handleStatusChange = (bug: Bug, newStatus: Status) => {
    dispatch({
      type: 'UPDATE_BUG',
      payload: { ...bug, status: newStatus, updatedAt: new Date().toISOString() },
    });
  };

  return (
    <>
      {/* Distribution bar + tab bar — always shown even when list is empty */}
      <BugDistributionBar bugs={state.bugs} />
      <StatusTabBar bugs={state.bugs} activeStatus={activeTab} onSelect={handleTabSelect} />

      {filteredBugs.length === 0 ? (
        <EmptyState
          type={state.bugs.length === 0 || !hasFiltersActive ? 'no-bugs' : 'no-results'}
          onAddBug={onAddBug}
        />
      ) : (
        <div className="space-y-3">
          {filteredBugs.map((bug, idx) => {
            const DELAYS = ['delay-0','delay-40','delay-80','delay-120','delay-160','delay-200'];
            const delayClass = DELAYS[Math.min(idx, DELAYS.length - 1)];
            return (
              <div
                key={bug.id}
                className={`
                  bg-white dark:bg-slate-800
                  rounded-xl border border-slate-200 dark:border-slate-700
                  border-l-4 ${SEVERITY_BORDER[bug.severity] ?? 'border-l-slate-200'}
                  shadow-sm hover:shadow-md
                  transition-shadow duration-200
                  animate-fade-slide-in ${delayClass}
                `}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {bug.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {bug.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Tooltip text="Edit bug">
                        <button
                          type="button"
                          onClick={() => onEdit(bug)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          aria-label="Edit bug"
                        >
                          <Edit2 size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete bug">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(bug.id)}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          aria-label="Delete bug"
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip text={expandedBug === bug.id ? 'Collapse' : 'Expand details'}>
                        <button
                          type="button"
                          onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          aria-label="Toggle details"
                        >
                          {expandedBug === bug.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={bug.status} />
                    <SeverityBadge severity={bug.severity} />
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Assigned to{' '}
                      <span className="font-medium text-slate-600 dark:text-slate-300">{bug.assignedTo}</span>
                    </span>
                    <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      {new Date(bug.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {expandedBug === bug.id && (
                  <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-4 space-y-4 animate-fade-slide-in">
                    <StatusStepper
                      bug={bug}
                      onStatusChange={newStatus => handleStatusChange(bug, newStatus)}
                    />
                    <Comments bugId={bug.id} />
                    <ActivityLog bugId={bug.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pendingDeleteId && (
        <ConfirmModal
          title="Delete Bug"
          message={`Are you sure you want to delete "${state.bugs.find(b => b.id === pendingDeleteId)?.title ?? 'this bug'}"? This action cannot be undone.`}
          onConfirm={() => {
            dispatch({ type: 'DELETE_BUG', payload: pendingDeleteId });
            setPendingDeleteId(null);
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}
