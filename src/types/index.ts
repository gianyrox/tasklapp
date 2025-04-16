export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  friend?: User; // Populated when getting friend details
}

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
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
  estimatedTimeMinutes?: number;
  actualTimeMinutes?: number;
  submissionDate?: Date;
  qualityRating?: number; // 1-5 rating
  feedback?: string;
  attachments?: TaskAttachment[];
  assigner?: User; // Populated with assigner profile information
  assignee?: User; // Populated with assignee profile information
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileUrl: string;
  fileType?: string;
  fileName?: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  tasksCompleted: number;
  avgCompletionTime?: number; // In minutes
  avgQualityRating?: number; // 1-5 average
  tasksOverdue: number;
  isFriend: boolean;
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