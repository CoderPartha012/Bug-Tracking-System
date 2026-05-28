import React from 'react';
import { LayoutList, Kanban, Plus, LayoutDashboard } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface BottomNavProps {
  viewMode: 'list' | 'kanban';
  onViewChange: (v: 'list' | 'kanban') => void;
  onAddBug: () => void;
  onScrollTop: () => void;
}

export function BottomNav({ viewMode, onViewChange, onAddBug, onScrollTop }: BottomNavProps) {
  const itemBase = 'flex flex-col items-center justify-center gap-0.5 py-2 px-3 flex-1 transition-colors';
  const activeText = 'text-blue-600 dark:text-blue-400';
  const inactiveText = 'text-slate-500 dark:text-slate-400';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 pb-safe">
      <div className="flex items-end justify-around">

        {/* Dashboard / scroll-to-top */}
        <button
          type="button"
          onClick={onScrollTop}
          className={`${itemBase} ${inactiveText} hover:text-slate-700 dark:hover:text-slate-300`}
          aria-label="Dashboard"
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </button>

        {/* List view */}
        <button
          type="button"
          onClick={() => onViewChange('list')}
          className={`${itemBase} ${viewMode === 'list' ? activeText : inactiveText}`}
          aria-label="List view"
        >
          <LayoutList size={20} />
          <span className="text-[10px] font-medium leading-none">List</span>
        </button>

        {/* Add Bug FAB (elevated centre button) */}
        <div className="flex flex-col items-center -mt-4">
          <button
            type="button"
            onClick={onAddBug}
            className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-150"
            aria-label="Add bug"
            title="Add Bug (N)"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-none">Add</span>
        </div>

        {/* Kanban view */}
        <button
          type="button"
          onClick={() => onViewChange('kanban')}
          className={`${itemBase} ${viewMode === 'kanban' ? activeText : inactiveText}`}
          aria-label="Kanban view"
        >
          <Kanban size={20} />
          <span className="text-[10px] font-medium leading-none">Kanban</span>
        </button>

        {/* Notifications */}
        <div className={`${itemBase} relative`}>
          <NotificationBell mobileMode />
          <span className="text-[10px] font-medium leading-none text-slate-500 dark:text-slate-400 mt-0.5">Alerts</span>
        </div>

      </div>
    </nav>
  );
}
