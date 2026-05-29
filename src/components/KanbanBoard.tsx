import React, { useState } from 'react';
import { Bug, Status } from '../types/bug';
import { useBugs } from '../context/BugContext';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { ConfirmModal } from './ConfirmModal';
import { STATUS_CONFIGS } from '../lib/statusConfig';

interface KanbanBoardProps {
  bugs: Bug[];
  onEdit: (bug: Bug) => void;
}

interface ColumnConfig {
  status: Status;
  label: string;
  color: string;
  tooltip: string;
  collapsible: boolean;
}

const COLUMNS: ColumnConfig[] = [
  { status: 'new',         label: 'New',         color: '#6B7280', tooltip: 'New — just reported, awaiting triage',    collapsible: false },
  { status: 'open',        label: 'Open',         color: '#3B82F6', tooltip: 'Open — confirmed and queued for work',    collapsible: false },
  { status: 'in-progress', label: 'In Progress',  color: '#EAB308', tooltip: 'In Progress — actively being worked on', collapsible: false },
  { status: 'in-review',   label: 'In Review',    color: '#8B5CF6', tooltip: 'In Review — code review in progress',    collapsible: false },
  { status: 'testing',     label: 'Testing',      color: '#F97316', tooltip: 'Testing — QA verification in progress',  collapsible: false },
  { status: 'closed',      label: 'Closed',       color: '#22C55E', tooltip: 'Closed — resolved and verified',         collapsible: true  },
  { status: 'rejected',    label: 'Rejected',     color: '#EF4444', tooltip: "Rejected — won't fix",                   collapsible: true  },
];

const SEVERITY_BORDER: Record<string, string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-400',
  low:    'border-l-emerald-400',
};

const SEVERITY_BADGE: Record<string, string> = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const SEVERITY_TOOLTIP: Record<string, string> = {
  high:   'High — requires immediate attention',
  medium: 'Medium — should be addressed soon',
  low:    'Low — minor issue, address when possible',
};

export function KanbanBoard({ bugs, onEdit }: KanbanBoardProps) {
  const { dispatch } = useBugs();
  const [draggedId, setDraggedId]             = useState<string | null>(null);
  const [dropTarget, setDropTarget]           = useState<Status | null>(null);
  const [recentlyMoved, setRecentlyMoved]     = useState<Set<string>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [collapsed, setCollapsed]             = useState<Set<Status>>(new Set());

  const toggleCollapse = (status: Status) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, bugId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(bugId);
  };

  const handleDragEnd = () => { setDraggedId(null); setDropTarget(null); };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(status);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: Status) => {
    e.preventDefault();
    if (!draggedId) return;
    const bug = bugs.find(b => b.id === draggedId);
    if (bug && bug.status !== targetStatus) {
      dispatch({ type: 'UPDATE_BUG', payload: { ...bug, status: targetStatus, updatedAt: new Date().toISOString() } });
      setRecentlyMoved(prev => { const next = new Set(prev); next.add(draggedId); return next; });
      setTimeout(() => setRecentlyMoved(prev => { const next = new Set(prev); next.delete(draggedId!); return next; }), 500);
    }
    setDraggedId(null);
    setDropTarget(null);
  };

  const bugToDelete = bugs.find(b => b.id === pendingDeleteId);

  return (
    <>
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {COLUMNS.map(col => {
            const colBugs    = bugs.filter(b => b.status === col.status);
            const isCollapsed = collapsed.has(col.status);
            const isDropTarget = dropTarget === col.status;

            if (isCollapsed) {
              return (
                <div
                  key={col.status}
                  className="w-11 flex flex-col rounded-xl border transition-all duration-300 cursor-pointer select-none"
                  style={{ borderColor: `${col.color}40`, backgroundColor: `${col.color}08` }}
                  onClick={() => toggleCollapse(col.status)}
                  title={`Expand ${col.label} (${colBugs.length})`}
                >
                  <div
                    className="flex flex-col items-center py-3 gap-2 rounded-xl"
                    style={{ borderBottom: `2px solid ${col.color}30` }}
                  >
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${col.color}25`, color: col.color }}
                    >
                      {colBugs.length}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: col.color,
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {col.label}
                    </span>
                    <ChevronRight size={12} style={{ color: col.color }} />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={col.status}
                onDragOver={e => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.status)}
                className={`w-[200px] flex-shrink-0 rounded-xl border flex flex-col transition-all duration-200 min-h-[200px] ${
                  isDropTarget ? 'shadow-lg' : ''
                }`}
                style={{
                  borderColor: isDropTarget ? col.color : `${col.color}30`,
                  backgroundColor: isDropTarget ? `${col.color}08` : undefined,
                  outline: isDropTarget ? `2px solid ${col.color}` : undefined,
                  outlineOffset: isDropTarget ? '1px' : undefined,
                }}
              >
                {/* Column header */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-b"
                  style={{ backgroundColor: `${col.color}12`, borderColor: `${col.color}25` }}
                >
                  <Tooltip text={col.tooltip}>
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color }}
                    />
                  </Tooltip>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-1 truncate">
                    {col.label}
                  </span>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${col.color}20`, color: col.color }}
                  >
                    {colBugs.length}
                  </span>
                  {col.collapsible && (
                    <button
                      type="button"
                      onClick={() => toggleCollapse(col.status)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                      title={`Collapse ${col.label}`}
                      aria-label={`Collapse ${col.label}`}
                    >
                      <ChevronLeft size={12} />
                    </button>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[560px]">
                  {colBugs.length === 0 ? (
                    <div
                      className={`h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition-colors ${
                        isDropTarget ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'
                      }`}
                      style={{ borderColor: isDropTarget ? col.color : undefined }}
                    >
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
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1">
        {STATUS_CONFIGS.map(cfg => (
          <span key={cfg.status} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </span>
        ))}
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto italic">
          Drag cards between columns • Closed & Rejected are collapsible
        </span>
      </div>

      {pendingDeleteId && (
        <ConfirmModal
          title="Delete Bug"
          message={`Are you sure you want to delete "${bugToDelete?.title ?? 'this bug'}"? This action cannot be undone.`}
          onConfirm={() => { dispatch({ type: 'DELETE_BUG', payload: pendingDeleteId }); setPendingDeleteId(null); }}
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
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[90px]" title={bug.assignedTo}>
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
