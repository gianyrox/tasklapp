export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  stats: UserStats;
}

export interface UserStats {
  tasksCompleted: number;
  tasksAssigned: number;
  averageCompletionTime: number; // in hours
  completionRate: number; // percentage
  rank: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  dueDate: Date;
  assignerId: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt?: Date;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
} 