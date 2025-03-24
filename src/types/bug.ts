export type Severity = 'low' | 'medium' | 'high';
export type Status = 'open' | 'in-progress' | 'closed';
export type Role = 'admin' | 'developer' | 'tester';

export interface Comment {
  id: string;
  bugId: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  bugId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  isResolved: boolean;
  comments: Comment[];
  activityLogs: ActivityLog[];
  screenshots: string[];
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}