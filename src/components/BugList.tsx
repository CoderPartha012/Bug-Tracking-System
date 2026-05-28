import React, { useState } from 'react';
import { Bug } from '../types/bug';
import { useBugs } from '../context/BugContext';
import { AlertTriangle, Clock, CheckCircle, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Comments } from './Comments';
import { ActivityLog } from './ActivityLog';
import { Tooltip } from './Tooltip';
import { ListSkeletons } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { ConfirmModal } from './ConfirmModal';

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

const STATUS_TOOLTIP: Record<string, string> = {
  open:         'Open — reported, not yet started',
  'in-progress':'In Progress — actively being worked on',
  closed:       'Closed — resolved and verified',
};

function SeverityBadge({ severity }: { severity: string }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300';
  const map: Record<string, string> = {
    high:   `${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400`,
    medium: `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400`,
    low:    `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400`,
  };
  const icon = <AlertTriangle size={11} />;
  return (
    <Tooltip text={SEVERITY_TOOLTIP[severity] ?? severity}>
      <span className={map[severity] ?? base}>{icon} {severity}</span>
    </Tooltip>
  );
}

function StatusBadge({ status }: { status: string }) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300';
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    open:         { cls: `${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400`,         icon: <AlertTriangle size={11} /> },
    'in-progress':{ cls: `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400`, icon: <Clock size={11} /> },
    closed:       { cls: `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400`, icon: <CheckCircle size={11} /> },
  };
  const { cls, icon } = map[status] ?? { cls: base, icon: null };
  return (
    <Tooltip text={STATUS_TOOLTIP[status] ?? status}>
      <span className={cls}>{icon} {status}</span>
    </Tooltip>
  );
}

export function BugList({ onEdit, onAddBug }: BugListProps) {
  const { state, dispatch, loading, filteredBugs } = useBugs();
  const [expandedBug, setExpandedBug]       = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (loading) return <ListSkeletons count={4} />;

  const hasFiltersActive =
    state.filters.status !== 'all' ||
    state.filters.severity !== 'all' ||
    state.filters.assignedTo !== 'all' ||
    state.filters.search !== '';

  if (filteredBugs.length === 0) {
    return (
      <EmptyState
        type={state.bugs.length === 0 || !hasFiltersActive ? 'no-bugs' : 'no-results'}
        onAddBug={onAddBug}
      />
    );
  }

  return (
    <>
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
                  <Comments bugId={bug.id} />
                  <ActivityLog bugId={bug.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>

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
