import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { useBugs } from '../context/BugContext';
import type { Bug } from '../types/bug';

const STORAGE_KEY = 'bug-tracker-recently-viewed';
const MAX_RECENT  = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function trackRecentlyViewed(bugId: string): void {
  try {
    const current: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const deduped = current.filter(id => id !== bugId);
    const next = [bugId, ...deduped].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getRecentlyViewedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  open:          { icon: AlertTriangle, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',     label: 'Open'        },
  'in-progress': { icon: Timer,         cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', label: 'In Progress' },
  closed:        { icon: CheckCircle,   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', label: 'Closed' },
};

const SEVERITY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-emerald-500',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface RecentlyViewedProps {
  /** IDs maintained in App state so the list refreshes after each view */
  ids: string[];
  onOpen: (bug: Bug) => void;
}

export function RecentlyViewed({ ids, onOpen }: RecentlyViewedProps) {
  const { state } = useBugs();

  // Resolve IDs to actual bug objects (preserving order, skipping deleted bugs)
  const bugs = ids
    .map(id => state.bugs.find(b => b.id === id))
    .filter((b): b is Bug => b !== undefined);

  if (bugs.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Clock size={13} className="text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Recently Viewed
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {bugs.map(bug => {
          const statusCfg = STATUS_CONFIG[bug.status];
          const StatusIcon = statusCfg?.icon ?? AlertTriangle;

          return (
            <button
              key={bug.id}
              type="button"
              onClick={() => onOpen(bug)}
              className="
                flex-shrink-0 snap-start
                w-52 text-left
                bg-white dark:bg-slate-800
                rounded-xl border border-slate-200 dark:border-slate-700
                px-3.5 py-3
                hover:border-blue-300 dark:hover:border-blue-700
                hover:shadow-md
                transition-all duration-150
                group
              "
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {bug.title}
                </h4>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${SEVERITY_DOT[bug.severity] ?? 'bg-slate-400'}`} />
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${statusCfg?.cls ?? ''}`}>
                  <StatusIcon size={9} />
                  {statusCfg?.label ?? bug.status}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate ml-auto">
                  {bug.assignedTo}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
