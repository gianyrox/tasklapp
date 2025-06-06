export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  membershipType: 'FREE' | 'PREMIUM';
  stripeCustomerId?: string;
  membershipExpiresAt?: Date;
  isPremium?: boolean;
  stats: {
    rank: number;
    tasksCompleted: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  isPending?: boolean; // User created via invitation but hasn't completed signup
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
  assigneeId?: string;
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
  isInvitation?: boolean; // Flag to indicate if this is an invitation task for unregistered users
  emailPending?: string; // Email address for invitation tasks where the user has not yet registered
  attachments?: TaskAttachment[];
  assigner?: User; // Populated with assigner profile information
  assignee?: User; // Populated with assignee profile information
}

export interface TaskSubmissionUpdate {
  taskId: string;
  submissionContent: string;
  actualTimeMinutes?: number;
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

// Add membership-related interfaces
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripeProductId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId?: string;
  stripePaymentIntentId: string;
  amount: number; // Amount in cents
  currency: string;
  status: 'succeeded' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled';
  paymentMethodType?: string;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // In cents
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  stripeProductId: string;
  features: string[];
  popular?: boolean;
} 