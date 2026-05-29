import React, {
  createContext, useContext, useReducer,
  useEffect, useState, useMemo, useRef, useCallback,
} from 'react';
import { Bug, Comment, ActivityLog } from '../types/bug';
import { toast } from 'react-toastify';
import { addNotification } from '../lib/notifications';
import { STATUS_CONFIG_MAP, STATUS_ORDER } from '../lib/statusConfig';

export type SortField = 'date' | 'severity' | 'status' | 'assignee';

interface SortState { field: SortField; dir: 'asc' | 'desc' }

interface BugState {
  bugs: Bug[];
  filters: { status: string; severity: string; assignedTo: string; search: string };
  sort: SortState;
}

type BugAction =
  | { type: 'ADD_BUG';          payload: Bug }
  | { type: 'UPDATE_BUG';       payload: Bug }
  | { type: 'DELETE_BUG';       payload: string }
  | { type: 'SET_FILTERS';      payload: Partial<BugState['filters']> }
  | { type: 'SET_SORT';         payload: Partial<SortState> }
  | { type: 'LOAD_BUGS';        payload: Bug[] }
  | { type: 'ADD_COMMENT';      payload: { bugId: string; comment: Comment } }
  | { type: 'ADD_ACTIVITY_LOG'; payload: { bugId: string; log: ActivityLog } };

const SEVERITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

const initialState: BugState = {
  bugs:    [],
  filters: { status: 'all', severity: 'all', assignedTo: 'all', search: '' },
  sort:    { field: 'date', dir: 'desc' },
};

// ── Pure reducer — no side effects so StrictMode double-invoke is safe ────────

function bugReducer(state: BugState, action: BugAction): BugState {
  switch (action.type) {
    case 'ADD_BUG':
      return { ...state, bugs: [...state.bugs, action.payload] };

    case 'UPDATE_BUG':
      return { ...state, bugs: state.bugs.map(b => b.id === action.payload.id ? action.payload : b) };

    case 'DELETE_BUG':
      return { ...state, bugs: state.bugs.filter(b => b.id !== action.payload) };

    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case 'SET_SORT':
      return { ...state, sort: { ...state.sort, ...action.payload } };

    case 'LOAD_BUGS':
      return { ...state, bugs: action.payload };

    case 'ADD_COMMENT':
      return {
        ...state,
        bugs: state.bugs.map(b =>
          b.id === action.payload.bugId
            ? { ...b, comments: [...b.comments, action.payload.comment] }
            : b
        ),
      };

    case 'ADD_ACTIVITY_LOG':
      return {
        ...state,
        bugs: state.bugs.map(b =>
          b.id === action.payload.bugId
            ? { ...b, activityLogs: [...b.activityLogs, action.payload.log] }
            : b
        ),
      };

    default:
      return state;
  }
}

const BugContext = createContext<{
  state:        BugState;
  dispatch:     (action: BugAction) => void;
  loading:      boolean;
  filteredBugs: Bug[];
} | undefined>(undefined);

export function BugProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(bugReducer, initialState);
  const [loading, setLoading] = useState(true);

  // Always-current state ref so the dispatch wrapper doesn't re-create on every render
  const stateRef = useRef(state);
  stateRef.current = state;

  // Side effects live HERE (not in the reducer) so StrictMode double-invoke is safe
  const dispatch = useCallback((action: BugAction) => {
    if (action.type === 'ADD_BUG') {
      const shortId = action.payload.id.slice(0, 6).toUpperCase();
      const msg = `Bug #${shortId} has been created and is now New`;
      toast.success(msg);
      addNotification(msg, 'success');

    } else if (action.type === 'UPDATE_BUG') {
      const prev = stateRef.current.bugs.find(b => b.id === action.payload.id);
      const statusChanged = prev && prev.status !== action.payload.status;

      if (statusChanged && prev) {
        const prevLabel  = STATUS_CONFIG_MAP[prev.status]?.label ?? prev.status;
        const newLabel   = STATUS_CONFIG_MAP[action.payload.status]?.label ?? action.payload.status;
        const username   = localStorage.getItem('bug-tracker-username') ?? 'Unknown';
        const shortId    = action.payload.id.slice(0, 6).toUpperCase();

        let msg: string;
        if (action.payload.status === 'rejected') {
          msg = `Bug #${shortId} has been Rejected`;
        } else if (action.payload.status === 'closed') {
          msg = `Bug #${shortId} is Closed and verified`;
        } else if (action.payload.status === 'testing') {
          msg = `Bug #${shortId} is now in Testing`;
        } else {
          msg = `Bug #${shortId} moved to ${newLabel} by ${username}`;
        }
        toast.info(msg);
        addNotification(msg, 'info');

        // Auto-log the status change
        const logEntry: ActivityLog = {
          id: crypto.randomUUID(),
          bugId: action.payload.id,
          action: 'status_changed',
          details: `Status changed from ${prevLabel} to ${newLabel} by ${username} on ${new Date().toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
        };
        rawDispatch({ type: 'ADD_ACTIVITY_LOG', payload: { bugId: action.payload.id, log: logEntry } });
      } else {
        const msg = `Bug updated: "${action.payload.title}"`;
        toast.info(msg);
        addNotification(msg, 'info');
      }

    } else if (action.type === 'DELETE_BUG') {
      const deleted = stateRef.current.bugs.find(b => b.id === action.payload);
      const msg = `Bug deleted: "${deleted?.title ?? 'Unknown'}"`;
      toast.warning(msg);
      addNotification(msg, 'warning');
    }

    rawDispatch(action);
  }, [rawDispatch]);

  useEffect(() => {
    const saved = localStorage.getItem('bugs');
    if (saved) {
      try { rawDispatch({ type: 'LOAD_BUGS', payload: JSON.parse(saved) }); }
      catch { /* corrupted — ignore */ }
    }
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem('bugs', JSON.stringify(state.bugs));
  }, [state.bugs, loading]);

  const filteredBugs = useMemo(() => {
    const { filters, sort } = state;
    const q = filters.search.toLowerCase();

    let result = state.bugs.filter(bug => {
      if (filters.status !== 'all' && bug.status !== filters.status) return false;
      if (filters.severity !== 'all' && bug.severity !== filters.severity) return false;
      if (
        filters.assignedTo !== 'all' && filters.assignedTo !== '' &&
        !bug.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase())
      ) return false;
      if (q && !bug.title.toLowerCase().includes(q) && !bug.description.toLowerCase().includes(q)) return false;
      return true;
    });

    const mult = sort.dir === 'desc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sort.field) {
        case 'date':     return mult * (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        case 'severity': return mult * ((SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0));
        case 'status':   return mult * ((STATUS_ORDER[b.status] ?? 0)   - (STATUS_ORDER[a.status] ?? 0));
        case 'assignee': return mult * a.assignedTo.localeCompare(b.assignedTo);
        default:         return 0;
      }
    });

    return result;
  }, [state.bugs, state.filters, state.sort]);

  return (
    <BugContext.Provider value={{ state, dispatch, loading, filteredBugs }}>
      {children}
    </BugContext.Provider>
  );
}

export const useBugs = () => {
  const ctx = useContext(BugContext);
  if (!ctx) throw new Error('useBugs must be used within a BugProvider');
  return ctx;
};
