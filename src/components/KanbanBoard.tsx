import React, { useState } from 'react';
import { Bug, Status } from '../types/bug';
import { useBugs } from '../context/BugContext';
import { AlertTriangle, Clock, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { ConfirmModal } from './ConfirmModal';

interface KanbanBoardProps {
  bugs: Bug[];
  onEdit: (bug: Bug) => void;
}

const COLUMNS: {
  status: Status;
  label: string;
  icon: React.ElementType;
  tooltip: string;
  headerBg: string;
  headerBorder: string;
  colBg: string;
  iconCls: string;
  countCls: string;
  dropRing: string;
}[] = [
  {
    status: 'open',
    label: 'Open',
    icon: AlertTriangle,
    tooltip: 'Bugs that have been reported and not yet started',
    headerBg: 'bg-red-50 dark:bg-red-950/40',
    headerBorder: 'border-red-200 dark:border-red-900/60',
    colBg: 'bg-slate-50/60 dark:bg-slate-900/40',
    iconCls: 'text-red-500',
    countCls: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    dropRing: 'ring-2 ring-red-400 bg-red-50/80 dark:bg-red-950/30',
  },
  {
    status: 'in-progress',
    label: 'In Progress',
    icon: Clock,
    tooltip: 'Bugs actively being worked on',
    headerBg: 'bg-amber-50 dark:bg-amber-950/40',
    headerBorder: 'border-amber-200 dark:border-amber-900/60',
    colBg: 'bg-slate-50/60 dark:bg-slate-900/40',
    iconCls: 'text-amber-500',
    countCls: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    dropRing: 'ring-2 ring-amber-400 bg-amber-50/80 dark:bg-amber-950/30',
  },
  {
    status: 'closed',
    label: 'Closed',
    icon: CheckCircle,
    tooltip: 'Bugs that have been resolved and verified',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    headerBorder: 'border-emerald-200 dark:border-emerald-900/60',
    colBg: 'bg-slate-50/60 dark:bg-slate-900/40',
    iconCls: 'text-emerald-500',
    countCls: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400',
    dropRing: 'ring-2 ring-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30',
  },
];

const SEVERITY_BORDER: Record<string, string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-400',
  low:    'border-l-emerald-400',
};

const SEVERITY_TOOLTIP: Record<string, string> = {
  high:   'High — requires immediate attention',
  medium: 'Medium — should be addressed soon',
  low:    'Low — minor issue, address when possible',
};

const SEVERITY_BADGE: Record<string, string> = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

export function KanbanBoard({ bugs, onEdit }: KanbanBoardProps) {
  const { dispatch } = useBugs();
  const [draggedId, setDraggedId]           = useState<string | null>(null);
  const [dropTarget, setDropTarget]         = useState<Status | null>(null);
  const [recentlyMoved, setRecentlyMoved]   = useState<Set<string>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, bugId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(bugId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(status);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: Status) => {
    e.preventDefault();
    if (!draggedId) return;
    const bug = bugs.find(b => b.id === draggedId);
    if (bug && bug.status !== targetStatus) {
      dispatch({
        type: 'UPDATE_BUG',
        payload: { ...bug, status: targetStatus, updatedAt: new Date().toISOString() },
      });
      setRecentlyMoved(prev => {
        const next = new Set(prev);
        next.add(draggedId);
        return next;
      });
      setTimeout(() => {
        setRecentlyMoved(prev => {
          const next = new Set(prev);
          next.delete(draggedId!);
          return next;
        });
      }, 500);
    }
    setDraggedId(null);
    setDropTarget(null);
  };

  const bugToDelete = bugs.find(b => b.id === pendingDeleteId);

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const colBugs = bugs.filter(b => b.status === col.status);
        const isDropTarget = dropTarget === col.status;
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.status)}
            className={`
              rounded-xl border border-slate-200 dark:border-slate-700
              transition-all duration-200 min-h-[200px] flex flex-col
              ${isDropTarget ? col.dropRing : col.colBg}
            `}
          >
            {/* Column header */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl border-b ${col.headerBg} ${col.headerBorder}`}>
              <Tooltip text={col.tooltip}>
                <Icon size={15} className={col.iconCls} />
              </Tooltip>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${col.countCls}`}>
                {colBugs.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[600px]">
              {colBugs.length === 0 ? (
                <div className={`h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-slate-400 dark:text-slate-600 transition-colors ${isDropTarget ? 'border-blue-300 dark:border-blue-700 text-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                  {isDropTarget ? 'Drop here' : 'No bugs'}
                </div>
              ) : (
                colBugs.map(bug => (
                  <KanbanCard
                    key={bug.id}
                    bug={bug}
                    isDragging={draggedId === bug.id}
                    isNew={recentlyMoved.has(bug.id)}
                    onEdit={onEdit}
                    onDelete={() => setPendingDeleteId(bug.id)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>

    {pendingDeleteId && (
      <ConfirmModal
        title="Delete Bug"
        message={`Are you sure you want to delete "${bugToDelete?.title ?? 'this bug'}"? This action cannot be undone.`}
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

interface KanbanCardProps {
  bug: Bug;
  isDragging: boolean;
  isNew: boolean;
  onEdit: (bug: Bug) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
}

function KanbanCard({ bug, isDragging, isNew, onEdit, onDelete, onDragStart, onDragEnd }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, bug.id)}
      onDragEnd={onDragEnd}
      className={`
        bg-white dark:bg-slate-800
        rounded-lg border border-slate-200 dark:border-slate-700
        border-l-4 ${SEVERITY_BORDER[bug.severity] ?? 'border-l-slate-300'}
        shadow-sm hover:shadow-md
        cursor-grab active:cursor-grabbing
        transition-all duration-200 select-none
        ${isDragging ? 'opacity-40 scale-95 rotate-1 shadow-lg' : 'opacity-100'}
        ${isNew ? 'animate-fade-slide-in' : ''}
      `}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 flex-1">
            {bug.title}
          </h4>
          <div className="flex gap-0.5 flex-shrink-0 -mt-0.5">
            <button
              type="button"
              onClick={() => onEdit(bug)}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Edit"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {bug.description}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Tooltip text={SEVERITY_TOOLTIP[bug.severity] ?? bug.severity}>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[bug.severity]}`}>
              {bug.severity}
            </span>
          </Tooltip>
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[100px]" title={bug.assignedTo}>
            {bug.assignedTo}
          </span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 tabular-nums flex-shrink-0">
            {new Date(bug.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
