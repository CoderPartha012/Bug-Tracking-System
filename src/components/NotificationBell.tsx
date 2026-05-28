import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, CheckCheck, Trash2, X,
  CheckCircle2, AlertTriangle, AlertCircle, Info,
} from 'lucide-react';
import {
  getNotifications,
  markAllRead,
  clearNotifications,
  subscribeNotifications,
  type AppNotification,
} from '../lib/notifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  switch (type) {
    case 'success': return <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />;
    case 'warning': return <AlertTriangle size={14} className="text-amber-500  flex-shrink-0 mt-0.5" />;
    case 'error':   return <AlertCircle  size={14} className="text-red-500    flex-shrink-0 mt-0.5" />;
    default:        return <Info         size={14} className="text-blue-500   flex-shrink-0 mt-0.5" />;
  }
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** When true, the dropdown opens upward (used inside the mobile bottom nav) */
  mobileMode?: boolean;
}

export function NotificationBell({ mobileMode = false }: NotificationBellProps) {
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState<AppNotification[]>(getNotifications);
  const panelRef            = useRef<HTMLDivElement>(null);

  // Sync state whenever the notification store changes
  useEffect(() => subscribeNotifications(() => setNotifs(getNotifications())), []);

  // Close when clicking outside the panel
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-mark-as-read 1 s after the panel is opened
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(markAllRead, 1000);
    return () => clearTimeout(t);
  }, [open]);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div ref={panelRef} className="relative">

      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label={unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'Notifications'}
        title="Notifications"
      >
        <Bell className={`h-5 w-5 transition-colors ${open || unread > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`} />

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none animate-fade-in pointer-events-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel — opens upward in mobile bottom-nav, downward elsewhere */}
      {open && (
        <div className={`absolute right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-[60] overflow-hidden animate-fade-slide-in ${mobileMode ? 'bottom-full mb-2' : 'top-full mt-2'}`}>

          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
              {notifs.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                  ({notifs.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {notifs.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Mark all read"
                    aria-label="Mark all as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Clear all"
                    aria-label="Clear all notifications"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-80">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Actions you take will appear here.
                </p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`
                    flex items-start gap-3 px-4 py-3
                    border-b border-slate-50 dark:border-slate-800 last:border-0
                    transition-colors
                    ${!n.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
                  `}
                >
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                      {timeAgo(n.timestamp)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Showing last {notifs.length} notification{notifs.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
