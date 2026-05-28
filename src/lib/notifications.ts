export type NotifType = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  message: string;
  type: NotifType;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'bug-tracker-notifications';
const MAX_NOTIFICATIONS = 50;

// Module-level pub/sub so any component can subscribe without React context
const listeners = new Set<() => void>();

export function getNotifications(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

export function addNotification(message: string, type: NotifType = 'info'): void {
  const entry: AppNotification = {
    id: crypto.randomUUID(),
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
  };
  const next = [entry, ...getNotifications()].slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach(fn => fn());
}

export function markAllRead(): void {
  const next = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach(fn => fn());
}

export function clearNotifications(): void {
  localStorage.setItem(STORAGE_KEY, '[]');
  listeners.forEach(fn => fn());
}

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribeNotifications(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
