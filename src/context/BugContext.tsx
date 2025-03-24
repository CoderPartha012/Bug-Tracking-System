import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Bug, Comment, ActivityLog } from '../types/bug';
import { toast } from 'react-toastify';

interface BugState {
  bugs: Bug[];
  filters: {
    status: string;
    severity: string;
    assignedTo: string;
    search: string;
  };
}

type BugAction =
  | { type: 'ADD_BUG'; payload: Bug }
  | { type: 'UPDATE_BUG'; payload: Bug }
  | { type: 'DELETE_BUG'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<BugState['filters']> }
  | { type: 'LOAD_BUGS'; payload: Bug[] }
  | { type: 'ADD_COMMENT'; payload: { bugId: string; comment: Comment } }
  | { type: 'ADD_ACTIVITY_LOG'; payload: { bugId: string; log: ActivityLog } };

const initialState: BugState = {
  bugs: [],
  filters: {
    status: 'all',
    severity: 'all',
    assignedTo: 'all',
    search: '',
  },
};

function bugReducer(state: BugState, action: BugAction): BugState {
  switch (action.type) {
    case 'ADD_BUG':
      toast.success('Bug created successfully!');
      return {
        ...state,
        bugs: [...state.bugs, action.payload],
      };
    case 'UPDATE_BUG':
      toast.info('Bug updated successfully!');
      return {
        ...state,
        bugs: state.bugs.map(bug =>
          bug.id === action.payload.id ? action.payload : bug
        ),
      };
    case 'DELETE_BUG':
      toast.warning('Bug deleted');
      return {
        ...state,
        bugs: state.bugs.filter(bug => bug.id !== action.payload),
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case 'LOAD_BUGS':
      return {
        ...state,
        bugs: action.payload,
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        bugs: state.bugs.map(bug =>
          bug.id === action.payload.bugId
            ? { ...bug, comments: [...bug.comments, action.payload.comment] }
            : bug
        ),
      };
    case 'ADD_ACTIVITY_LOG':
      return {
        ...state,
        bugs: state.bugs.map(bug =>
          bug.id === action.payload.bugId
            ? { ...bug, activityLogs: [...bug.activityLogs, action.payload.log] }
            : bug
        ),
      };
    default:
      return state;
  }
}

const BugContext = createContext<{
  state: BugState;
  dispatch: React.Dispatch<BugAction>;
} | undefined>(undefined);

export function BugProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bugReducer, initialState);

  useEffect(() => {
    const savedBugs = localStorage.getItem('bugs');
    if (savedBugs) {
      dispatch({ type: 'LOAD_BUGS', payload: JSON.parse(savedBugs) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bugs', JSON.stringify(state.bugs));
  }, [state.bugs]);

  return (
    <BugContext.Provider value={{ state, dispatch }}>
      {children}
    </BugContext.Provider>
  );
}

export const useBugs = () => {
  const context = useContext(BugContext);
  if (context === undefined) {
    throw new Error('useBugs must be used within a BugProvider');
  }
  return context;
};