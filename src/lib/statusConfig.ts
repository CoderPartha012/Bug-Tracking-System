import type { Status } from '../types/bug';

export interface StatusConfig {
  status: Status;
  label: string;
  color: string;
  tooltip: string;
}

export const STATUS_CONFIGS: StatusConfig[] = [
  { status: 'new',         label: 'New',         color: '#6B7280', tooltip: 'New — just reported, awaiting triage' },
  { status: 'open',        label: 'Open',         color: '#3B82F6', tooltip: 'Open — confirmed and queued for work' },
  { status: 'in-progress', label: 'In Progress',  color: '#EAB308', tooltip: 'In Progress — actively being worked on' },
  { status: 'in-review',   label: 'In Review',    color: '#8B5CF6', tooltip: 'In Review — code review in progress' },
  { status: 'testing',     label: 'Testing',      color: '#F97316', tooltip: 'Testing — QA verification in progress' },
  { status: 'closed',      label: 'Closed',       color: '#22C55E', tooltip: 'Closed — resolved and verified' },
  { status: 'rejected',    label: 'Rejected',     color: '#EF4444', tooltip: "Rejected — not a valid bug or won't fix" },
];

export const STATUS_CONFIG_MAP: Record<Status, StatusConfig> = Object.fromEntries(
  STATUS_CONFIGS.map(c => [c.status, c])
) as Record<Status, StatusConfig>;

export const LIFECYCLE_STAGES: Status[] = [
  'new', 'open', 'in-progress', 'in-review', 'testing', 'closed',
];

export const STATUS_ORDER: Record<string, number> = {
  new: 1, open: 2, 'in-progress': 3, 'in-review': 4, testing: 5, closed: 6, rejected: 7,
};

export function getNextStatus(current: Status): Status | null {
  const idx = LIFECYCLE_STAGES.indexOf(current);
  if (idx === -1 || idx >= LIFECYCLE_STAGES.length - 1) return null;
  return LIFECYCLE_STAGES[idx + 1];
}
