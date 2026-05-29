import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBugs } from '../context/BugContext';
import type { SortField } from '../context/BugContext';
import {
  Search, X, SlidersHorizontal, Bookmark, ArrowUpDown, Star,
} from 'lucide-react';
import { toast } from 'react-toastify';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SavedFilter {
  id: string;
  name: string;
  filters: { status: string; severity: string; assignedTo: string; search: string };
  sort: { field: SortField; dir: 'asc' | 'desc' };
}

type ChipType = 'status' | 'severity' | 'search' | 'assignee' | 'sort';

// ── Constants ─────────────────────────────────────────────────────────────────

const SAVED_KEY = 'bug-tracker-saved-filters';

const SORT_OPTIONS: {
  value: string; label: string;
  field: SortField; dir: 'asc' | 'desc';
}[] = [
  { value: 'date-desc',     label: 'Newest first',         field: 'date',     dir: 'desc' },
  { value: 'date-asc',      label: 'Oldest first',         field: 'date',     dir: 'asc'  },
  { value: 'severity-desc', label: 'Severity: High → Low', field: 'severity', dir: 'desc' },
  { value: 'severity-asc',  label: 'Severity: Low → High', field: 'severity', dir: 'asc'  },
  { value: 'status-desc',   label: 'Status: Open first',   field: 'status',   dir: 'desc' },
  { value: 'status-asc',    label: 'Status: Closed first', field: 'status',   dir: 'asc'  },
  { value: 'assignee-asc',  label: 'Assignee: A → Z',      field: 'assignee', dir: 'asc'  },
  { value: 'assignee-desc', label: 'Assignee: Z → A',      field: 'assignee', dir: 'desc' },
];

const CHIP_STYLE: Record<ChipType, { bg: string; text: string; border: string }> = {
  status:   { bg: 'bg-blue-50 dark:bg-blue-950/50',     text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-200 dark:border-blue-800'   },
  severity: { bg: 'bg-amber-50 dark:bg-amber-950/50',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800' },
  search:   { bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  assignee: { bg: 'bg-teal-50 dark:bg-teal-950/50',     text: 'text-teal-700 dark:text-teal-300',     border: 'border-teal-200 dark:border-teal-800'   },
  sort:     { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700' },
};

const SEV_BADGE: Record<string, string> = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const STATUS_BADGE: Record<string, string> = {
  new:           'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  open:          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'in-review':   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  testing:       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  closed:        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// ── Helper components ─────────────────────────────────────────────────────────

function FilterChip({
  label, type, onRemove,
}: {
  label: string; type: ChipType; onRemove: () => void;
}) {
  const { bg, text, border } = CHIP_STYLE[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border} animate-fade-in`}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:opacity-60 transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function Filters() {
  const { state, dispatch } = useBugs();

  // Search dropdown
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Save-filter UI
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Persisted saved filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'); }
    catch { return []; }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchContainerRef.current?.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus save input
  useEffect(() => {
    if (isSavingMode) saveInputRef.current?.focus();
  }, [isSavingMode]);

  // Live search results (max 6)
  const searchResults = useMemo(() => {
    if (!searchFocused || !state.filters.search.trim()) return [];
    const q = state.filters.search.toLowerCase();
    return state.bugs
      .filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [state.bugs, state.filters.search, searchFocused]);

  // Current sort key
  const sortValue = `${state.sort.field}-${state.sort.dir}`;
  const isDefaultSort = state.sort.field === 'date' && state.sort.dir === 'desc';

  const handleSortChange = (value: string) => {
    const opt = SORT_OPTIONS.find(o => o.value === value);
    if (opt) dispatch({ type: 'SET_SORT', payload: { field: opt.field, dir: opt.dir } });
  };

  // Active filter chips
  const activeChips: { key: string; label: string; type: ChipType; onRemove: () => void }[] =
    useMemo(() => {
      const chips: { key: string; label: string; type: ChipType; onRemove: () => void }[] = [];
      if (state.filters.status !== 'all')
        chips.push({ key: 'status', label: `Status: ${state.filters.status}`, type: 'status', onRemove: () => dispatch({ type: 'SET_FILTERS', payload: { status: 'all' } }) });
      if (state.filters.severity !== 'all')
        chips.push({ key: 'severity', label: `Severity: ${state.filters.severity}`, type: 'severity', onRemove: () => dispatch({ type: 'SET_FILTERS', payload: { severity: 'all' } }) });
      if (state.filters.assignedTo !== 'all' && state.filters.assignedTo !== '')
        chips.push({ key: 'assignee', label: `Assignee: ${state.filters.assignedTo}`, type: 'assignee', onRemove: () => dispatch({ type: 'SET_FILTERS', payload: { assignedTo: 'all' } }) });
      if (state.filters.search !== '')
        chips.push({ key: 'search', label: `"${state.filters.search}"`, type: 'search', onRemove: () => dispatch({ type: 'SET_FILTERS', payload: { search: '' } }) });
      if (!isDefaultSort)
        chips.push({ key: 'sort', label: SORT_OPTIONS.find(o => o.value === sortValue)?.label ?? sortValue, type: 'sort', onRemove: () => dispatch({ type: 'SET_SORT', payload: { field: 'date', dir: 'desc' } }) });
      return chips;
    }, [state.filters, state.sort, isDefaultSort, sortValue, dispatch]);

  const clearAll = () => {
    dispatch({ type: 'SET_FILTERS', payload: { status: 'all', severity: 'all', assignedTo: 'all', search: '' } });
    dispatch({ type: 'SET_SORT', payload: { field: 'date', dir: 'desc' } });
  };

  const saveCurrentFilter = () => {
    const name = saveName.trim();
    if (!name) return;
    const entry: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filters: { ...state.filters },
      sort: { ...state.sort },
    };
    const next = [...savedFilters, entry];
    setSavedFilters(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaveName('');
    setIsSavingMode(false);
    toast.success(`Filter "${name}" saved`);
  };

  const deleteSavedFilter = (id: string) => {
    const next = savedFilters.filter(f => f.id !== id);
    setSavedFilters(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const applyFilter = (f: SavedFilter) => {
    dispatch({ type: 'SET_FILTERS', payload: f.filters });
    dispatch({ type: 'SET_SORT',    payload: f.sort });
  };

  const inp = 'block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white px-3 py-2.5 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

  const hasActive = activeChips.length > 0;
  const hasSection = hasActive || savedFilters.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 overflow-visible">

      {/* ── Global search bar ── */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/60">
        <div ref={searchContainerRef} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search bugs by title or description…"
            value={state.filters.search}
            onChange={e => dispatch({ type: 'SET_FILTERS', payload: { search: e.target.value } })}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={e => { if (e.key === 'Escape') setSearchFocused(false); }}
            className={`${inp} pl-10 pr-9`}
            aria-label="Search bugs"
          />
          {state.filters.search && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_FILTERS', payload: { search: '' } })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}

          {/* Live results dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-30 overflow-hidden animate-fade-slide-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Click to filter</span>
              </div>
              {searchResults.map(bug => (
                <button
                  key={bug.id}
                  type="button"
                  onMouseDown={e => {
                    // prevent input blur before onClick fires
                    e.preventDefault();
                    dispatch({ type: 'SET_FILTERS', payload: { search: bug.title } });
                    setSearchFocused(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Search size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
                    {bug.title}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SEV_BADGE[bug.severity] ?? ''}`}>
                      {bug.severity}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_BADGE[bug.status] ?? ''}`}>
                      {bug.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty search state */}
          {searchFocused && state.filters.search.trim() && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-30 px-4 py-3 animate-fade-slide-in">
              <p className="text-sm text-slate-400 dark:text-slate-500">No bugs match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter controls + sort ── */}
      <div className="px-4 py-3 flex flex-wrap gap-3 items-center border-b border-slate-100 dark:border-slate-700/60">
        <SlidersHorizontal size={14} className="text-slate-400 flex-shrink-0" />

        <select
          id="filter-status"
          value={state.filters.status}
          onChange={e => dispatch({ type: 'SET_FILTERS', payload: { status: e.target.value } })}
          className={`${inp} w-auto`}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="testing">Testing</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          id="filter-severity"
          value={state.filters.severity}
          onChange={e => dispatch({ type: 'SET_FILTERS', payload: { severity: e.target.value } })}
          className={`${inp} w-auto`}
          aria-label="Filter by severity"
        >
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <input
          type="text"
          placeholder="Assignee…"
          value={state.filters.assignedTo === 'all' ? '' : state.filters.assignedTo}
          onChange={e =>
            dispatch({ type: 'SET_FILTERS', payload: { assignedTo: e.target.value || 'all' } })
          }
          className={`${inp} w-auto min-w-[130px]`}
          aria-label="Filter by assignee"
        />

        {/* Sort + Save — pushed to right */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <ArrowUpDown size={14} className="text-slate-400 flex-shrink-0" />
          <select
            id="sort-select"
            value={sortValue}
            onChange={e => handleSortChange(e.target.value)}
            className={`${inp} w-auto`}
            aria-label="Sort bugs"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {!isSavingMode ? (
            <button
              type="button"
              onClick={() => setIsSavingMode(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              title="Save current filter as preset"
            >
              <Bookmark size={14} /> Save filter
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <input
                ref={saveInputRef}
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveCurrentFilter();
                  if (e.key === 'Escape') { setIsSavingMode(false); setSaveName(''); }
                }}
                placeholder="Filter name…"
                className={`${inp} w-36`}
                aria-label="Saved filter name"
              />
              <button
                type="button"
                onClick={saveCurrentFilter}
                disabled={!saveName.trim()}
                className="px-3 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setIsSavingMode(false); setSaveName(''); }}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Active filter chips + saved presets ── */}
      {hasSection && (
        <div className="px-4 py-2.5 flex flex-wrap items-center gap-2 min-h-[44px]">
          {hasActive && (
            <>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Active:</span>
              {activeChips.map(c => (
                <FilterChip key={c.key} label={c.label} type={c.type} onRemove={c.onRemove} />
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors underline underline-offset-2 ml-0.5"
              >
                Clear all
              </button>
            </>
          )}

          {savedFilters.length > 0 && (
            <>
              {hasActive && (
                <span className="text-slate-200 dark:text-slate-700 select-none" aria-hidden>|</span>
              )}
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Saved:</span>
              {savedFilters.map(f => (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-full text-xs font-medium border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 animate-fade-in"
                >
                  <button
                    type="button"
                    onClick={() => applyFilter(f)}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    title={`Apply "${f.name}"`}
                  >
                    <Star size={10} className="fill-current flex-shrink-0" />
                    <span>{f.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSavedFilter(f.id)}
                    className="ml-0.5 hover:opacity-60 transition-opacity flex-shrink-0"
                    aria-label={`Delete saved filter "${f.name}"`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
