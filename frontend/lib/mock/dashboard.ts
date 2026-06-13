/**
 * Static / mock data for the dashboard UI.
 *
 * This module is intentionally decoupled from the rendering layer so that each
 * section can later be swapped for a real API client (e.g. `dashboard-api.ts`)
 * without touching the components. Every shape below mirrors what a future
 * endpoint is expected to return.
 */

export type StatTrendDirection = 'up' | 'down' | 'neutral';

export interface DashboardStat {
  id: string;
  /** Short label shown above the value. */
  label: string;
  /** Pre-formatted display value (kept as string so "1,248" / "12" both work). */
  value: string;
  /** Lucide icon name, resolved to a component in the rendering layer. */
  icon: string;
  /** Accent palette key, resolved to Tailwind classes in the rendering layer. */
  accent: 'primary' | 'secondary' | 'accent' | 'success';
  /** Optional period-over-period change, e.g. "+12%". */
  change?: string;
  trend?: StatTrendDirection;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  accent: 'primary' | 'secondary' | 'accent' | 'success';
}

export type ActivityKind = 'event' | 'club' | 'task' | 'member' | 'resource';

export interface DashboardActivity {
  id: string;
  /** Who performed the action. */
  actor: string;
  /** Human-readable description of what happened. */
  action: string;
  /** The entity the action targeted. */
  target: string;
  /** ISO timestamp — formatted for display in the component. */
  timestamp: string;
  kind: ActivityKind;
}

export const dashboardStats: DashboardStat[] = [
  {
    id: 'members',
    label: 'Members',
    value: '1,248',
    icon: 'Users',
    accent: 'primary',
    change: '+8.2%',
    trend: 'up'
  },
  {
    id: 'clubs',
    label: 'Active Clubs',
    value: '32',
    icon: 'Users',
    accent: 'accent',
    change: '+3',
    trend: 'up'
  },
  {
    id: 'events',
    label: 'Upcoming Events',
    value: '14',
    icon: 'Calendar',
    accent: 'secondary',
    change: '+5',
    trend: 'up'
  },
  {
    id: 'tasks',
    label: 'Open Tasks',
    value: '47',
    icon: 'CheckSquare',
    accent: 'success',
    change: '-6',
    trend: 'down'
  }
];

export const dashboardQuickActions: DashboardQuickAction[] = [
  {
    id: 'create-club',
    label: 'Create Club',
    description: 'Start a new student club',
    href: '/clubs',
    icon: 'Users',
    accent: 'accent'
  },
  {
    id: 'schedule-event',
    label: 'Schedule Event',
    description: 'Plan an upcoming event',
    href: '/events',
    icon: 'CalendarPlus',
    accent: 'secondary'
  },
  {
    id: 'add-task',
    label: 'Add Task',
    description: 'Assign work to your team',
    href: '/tasks',
    icon: 'ListPlus',
    accent: 'success'
  },
  {
    id: 'view-calendar',
    label: 'Open Calendar',
    description: 'Review the planning timeline',
    href: '/calendar',
    icon: 'CalendarDays',
    accent: 'primary'
  }
];

export const dashboardActivity: DashboardActivity[] = [
  {
    id: 'a1',
    actor: 'Priya Sharma',
    action: 'registered for',
    target: 'Hack the Hill 2026',
    timestamp: '2026-06-13T09:24:00Z',
    kind: 'event'
  },
  {
    id: 'a2',
    actor: 'Robotics Club',
    action: 'created a new task',
    target: 'Order Arduino kits',
    timestamp: '2026-06-13T08:10:00Z',
    kind: 'task'
  },
  {
    id: 'a3',
    actor: 'Arjun Mehta',
    action: 'joined',
    target: 'Photography Society',
    timestamp: '2026-06-12T19:45:00Z',
    kind: 'member'
  },
  {
    id: 'a4',
    actor: 'Cultural Committee',
    action: 'scheduled',
    target: 'Annual Fest Kickoff',
    timestamp: '2026-06-12T16:30:00Z',
    kind: 'event'
  },
  {
    id: 'a5',
    actor: 'Sneha Patel',
    action: 'reserved',
    target: 'Auditorium A',
    timestamp: '2026-06-12T14:05:00Z',
    kind: 'resource'
  }
];

export type EventCategory =
  | 'meeting'
  | 'workshop'
  | 'competition'
  | 'cultural'
  | 'deadline';

export interface DashboardEvent {
  id: string;
  title: string;
  /** ISO timestamp of when the event starts. */
  date: string;
  location: string;
  category: EventCategory;
  attendees: number;
}

export const dashboardEvents: DashboardEvent[] = [
  {
    id: 'e1',
    title: 'Hack the Hill 2026',
    date: '2026-06-18T09:00:00Z',
    location: 'Main Auditorium',
    category: 'competition',
    attendees: 248
  },
  {
    id: 'e2',
    title: 'Robotics Workshop',
    date: '2026-06-20T14:30:00Z',
    location: 'Lab Block C',
    category: 'workshop',
    attendees: 64
  },
  {
    id: 'e3',
    title: 'Cultural Committee Sync',
    date: '2026-06-22T11:00:00Z',
    location: 'Room 204',
    category: 'meeting',
    attendees: 18
  },
  {
    id: 'e4',
    title: 'Annual Fest Proposal Deadline',
    date: '2026-06-25T23:59:00Z',
    location: 'Online',
    category: 'deadline',
    attendees: 0
  }
];

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface DashboardTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO due date. */
  due: string;
  assignee: string;
}

export const dashboardTasks: DashboardTask[] = [
  {
    id: 't1',
    title: 'Finalize sponsor deck for Hack the Hill',
    status: 'in_progress',
    priority: 'high',
    due: '2026-06-16T00:00:00Z',
    assignee: 'Priya Sharma'
  },
  {
    id: 't2',
    title: 'Book auditorium for cultural night',
    status: 'todo',
    priority: 'medium',
    due: '2026-06-19T00:00:00Z',
    assignee: 'Arjun Mehta'
  },
  {
    id: 't3',
    title: 'Publish robotics workshop registration form',
    status: 'done',
    priority: 'low',
    due: '2026-06-12T00:00:00Z',
    assignee: 'Sneha Patel'
  },
  {
    id: 't4',
    title: 'Confirm catering vendor quotes',
    status: 'in_progress',
    priority: 'high',
    due: '2026-06-17T00:00:00Z',
    assignee: 'Rahul Verma'
  }
];
