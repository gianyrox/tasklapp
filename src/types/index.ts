export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  membershipType: 'FREE' | 'MEMBER';
  stripeCustomerId?: string;
  membershipExpiresAt?: Date;
  isMember?: boolean;
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

// Public Tasks Types
export enum TaskCompletionType {
  APPLICATION_BASED = 'APPLICATION_BASED',
  PROOF_BASED = 'PROOF_BASED'
}

export enum TasklAppocationType {
  REMOTE = 'REMOTE',
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID'
}

export enum PayoutMethod {
  CRYPTO = 'CRYPTO',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  VENMO = 'VENMO',
  ZELLE = 'ZELLE',
  PAYPAL = 'PAYPAL',
  WESTERN_UNION = 'WESTERN_UNION',
  MONEYGRAM = 'MONEYGRAM',
  WISE = 'WISE',
  REMITLY = 'REMITLY',
  XOOM = 'XOOM'
}

export enum GradingMethod {
  CREATOR_ONLY = 'CREATOR_ONLY',
  COMMUNITY_VOTING = 'COMMUNITY_VOTING',
  BOTH = 'BOTH'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  GRADED = 'GRADED'
}

export interface PublicTask {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Task details
  completionType: TaskCompletionType;
  locationType: TasklAppocationType;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  locationCity?: string;
  locationCountry?: string;
  language: string;
  
  // Payment information
  paymentAmount: number;
  paymentCurrency: string;
  supportedPayoutMethods: PayoutMethod[];
  
  // Task management
  maxApplicants?: number;
  deadline?: Date;
  gradingMethod: GradingMethod;
  isActive: boolean;
  
  // Submission requirements
  submissionInstructions?: string;
  
  // Stats
  applicationCount: number;
  viewCount: number;
  
  // Populated fields
  creator?: User;
  tags?: PublicTaskTag[];
  media?: PublicTaskMedia[];
  applications?: PublicTaskApplication[];
}

export interface PublicTaskTag {
  id: string;
  taskId: string;
  tagName: string;
  createdAt: Date;
}

export interface PublicTaskMedia {
  id: string;
  taskId: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
}

export interface PublicTaskApplication {
  id: string;
  taskId: string;
  applicantId: string;
  appliedAt: Date;
  status: ApplicationStatus;
  
  // Application details
  applicationMessage?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // For proof-based tasks
  submissionContent?: string;
  submissionMediaUrls?: string[];
  submittedAt?: Date;
  
  // Grading
  creatorRating?: number;
  creatorFeedback?: string;
  communityRating?: number;
  communityVotes: number;
  gradedAt?: Date;
  
  // Populated fields
  applicant?: User;
  task?: PublicTask;
}

export interface PublicTaskComment {
  id: string;
  taskId: string;
  userId?: string;
  commenterName: string;
  commentText: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Populated fields
  user?: User;
}

export interface PublicTaskVote {
  id: string;
  applicationId: string;
  voterId?: string;
  voterIp?: string;
  rating: number;
  createdAt: Date;
}

export interface CreatePublicTaskData {
  title: string;
  description: string;
  completionType: TaskCompletionType;
  locationType: TasklAppocationType;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  locationCity?: string;
  locationCountry?: string;
  language: string;
  paymentAmount: number;
  paymentCurrency: string;
  supportedPayoutMethods: PayoutMethod[];
  maxApplicants?: number;
  deadline?: Date;
  gradingMethod: GradingMethod;
  submissionInstructions?: string;
  tags: string[];
  mediaFiles?: File[];
}

export interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export interface PublicTaskFilters {
  locationType?: TasklAppocationType;
  minPayment?: number;
  maxPayment?: number;
  tags?: string[];
  language?: string;
  completionType?: TaskCompletionType;
  search?: string;
}

export interface PublicTaskListResponse {
  tasks: PublicTask[];
  totalCount: number;
  hasMore: boolean;
} 