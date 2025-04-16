// User-facing application types
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  stats: {
    rank: number;
    tasksCompleted: number;
    completionRate: number;
    averageCompletionTime: number;
  };
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

export enum SubmissionType {
  FORM = 'FORM',
  LINK = 'LINK',
  FILE = 'FILE'
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
  submissionType?: SubmissionType;
  submissionInstructions?: string;
  startedAt?: Date;
  submissionDate?: Date;
  submissionContent?: string;
  qualityRating?: number; // 1-5 rating
  timelinessRating?: number; // 1-5 rating
  effortRating?: number; // 1-5 rating
  accuracyRating?: number; // 1-5 rating
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
  avgTimelinessRating?: number; // 1-5 average
  avgEffortRating?: number; // 1-5 average
  avgAccuracyRating?: number; // 1-5 average
  tasksOverdue: number;
  isFriend: boolean;
  perfectTasks?: number; // Number of tasks with perfect (5/5) ratings
  fastestCompletionTime?: number; // Fastest task completion time in minutes
  tasksOnTime?: number; // Number of tasks completed on time
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  GRADED = 'GRADED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Log entry structure for tracking app events
export interface LogEntry {
  id: string;
  userId: string;
  timestamp: Date;
  category: LogCategory;
  action: string;
  details?: Record<string, any>;
  context?: string;
}

export enum LogCategory {
  AUTH = 'AUTH',
  DATA = 'DATA',
  TASK = 'TASK',
  FRIEND = 'FRIEND',
  SYSTEM = 'SYSTEM',
  ERROR = 'ERROR'
}

// Mapping helpers to convert between database and application types
export interface TypeMappers {
  fromDbUser: (dbUser: any) => User;
  toDbUser: (user: Partial<User>) => any;
  fromDbTask: (dbTask: any) => Task;
  toDbTask: (task: Partial<Task>) => any;
  fromDbFriendship: (dbFriendship: any) => Friendship;
  toDbFriendship: (friendship: Partial<Friendship>) => any;
  fromDbTaskAttachment: (dbAttachment: any) => TaskAttachment;
  toDbTaskAttachment: (attachment: Partial<TaskAttachment>) => any;
  fromDbLeaderboardEntry: (dbEntry: any) => LeaderboardEntry;
  fromDbLogEntry: (dbLog: any) => LogEntry;
  toDbLogEntry: (log: Partial<LogEntry>) => any;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form input types
export interface TaskFormInput {
  title: string;
  description?: string;
  dueDate: Date;
  assigneeId: string;
  priority: TaskPriority;
  estimatedTimeMinutes?: number;
  submissionType?: SubmissionType;
  submissionInstructions?: string;
}

export interface TaskSubmissionInput {
  taskId: string;
  submissionContent?: string;
  actualTimeMinutes?: number;
  files?: File[];
}

export interface TaskEvaluationInput {
  taskId: string;
  qualityRating?: number;
  timelinessRating?: number;
  effortRating?: number;
  accuracyRating?: number;
  feedback?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
} 