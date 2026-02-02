import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Define schema for database tables
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatar_url: z.string().nullable().optional(),
  created_at: z.string().datetime()
});

export const friendshipSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  friend_id: z.string().uuid(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  due_date: z.string().datetime(),
  assigner_id: z.string().uuid(),
  assignee_id: z.string().uuid(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'GRADED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  completed_at: z.string().datetime().nullable().optional(),
  estimated_time_minutes: z.number().int().positive().nullable().optional(),
  actual_time_minutes: z.number().int().positive().nullable().optional(),
  submission_type: z.enum(['FORM', 'LINK', 'FILE']).nullable().optional(),
  submission_instructions: z.string().nullable().optional(),
  started_at: z.string().datetime().nullable().optional(),
  submission_date: z.string().datetime().nullable().optional(),
  submission_content: z.string().nullable().optional(),
  quality_rating: z.number().int().min(1).max(5).nullable().optional(),
  timeliness_rating: z.number().int().min(1).max(5).nullable().optional(),
  effort_rating: z.number().int().min(1).max(5).nullable().optional(),
  accuracy_rating: z.number().int().min(1).max(5).nullable().optional(),
  feedback: z.string().nullable().optional()
});

export const taskAttachmentSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  file_url: z.string(),
  file_type: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  created_at: z.string().datetime()
});

export const leaderboardEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  tasks_completed: z.number().int(),
  avg_completion_time: z.number().nullable().optional(),
  avg_quality_rating: z.number().nullable().optional(),
  avg_timeliness_rating: z.number().nullable().optional(),
  avg_effort_rating: z.number().nullable().optional(),
  avg_accuracy_rating: z.number().nullable().optional(),
  tasks_overdue: z.number().int()
});

export const logEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  category: z.enum(['AUTH', 'DATA', 'TASK', 'FRIEND', 'SYSTEM', 'ERROR']),
  action: z.string(),
  details: z.record(z.any()).nullable().optional(),
  context: z.string().nullable().optional()
});

// Database types (matches actual database structure)
export type DbUser = z.infer<typeof userSchema>;
export type DbFriendship = z.infer<typeof friendshipSchema>;
export type DbTask = z.infer<typeof taskSchema>;
export type DbTaskAttachment = z.infer<typeof taskAttachmentSchema>;
export type DbLeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type DbLogEntry = z.infer<typeof logEntrySchema>;

// Database client type with proper typing
export const createTypedSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Define database schema mapping for type safety
export const Database = {
  public: {
    tables: {
      users: {
        Row: userSchema.shape,
        Insert: {} as Omit<z.infer<typeof userSchema>, 'id' | 'created_at'>,
        Update: {} as Partial<Omit<z.infer<typeof userSchema>, 'id' | 'created_at'>>
      },
      friendships: {
        Row: friendshipSchema.shape,
        Insert: {} as Omit<z.infer<typeof friendshipSchema>, 'id' | 'created_at' | 'updated_at'>,
        Update: {} as Partial<Omit<z.infer<typeof friendshipSchema>, 'id' | 'created_at' | 'updated_at'>>
      },
      tasks: {
        Row: taskSchema.shape,
        Insert: {} as Omit<z.infer<typeof taskSchema>, 'id' | 'created_at'>,
        Update: {} as Partial<Omit<z.infer<typeof taskSchema>, 'id' | 'created_at'>>
      },
      task_attachments: {
        Row: taskAttachmentSchema.shape,
        Insert: {} as Omit<z.infer<typeof taskAttachmentSchema>, 'id' | 'created_at'>,
        Update: {} as Partial<Omit<z.infer<typeof taskAttachmentSchema>, 'id' | 'created_at'>>
      },
      user_logs: {
        Row: logEntrySchema.shape,
        Insert: {} as Omit<z.infer<typeof logEntrySchema>, 'id' | 'timestamp'>,
        Update: {} as Partial<Omit<z.infer<typeof logEntrySchema>, 'id' | 'timestamp'>>
      }
    },
    functions: {
      get_user_friends: {
        Args: { user_uuid: z.string().uuid() },
        Returns: z.array(z.object({
          friend_id: z.string().uuid(),
          friend_name: z.string(),
          friend_avatar: z.string().nullable(),
          friendship_status: z.string(),
          friendship_created: z.string().datetime()
        }))
      },
      get_leaderboard: {
        Args: {} as Record<string, never>,
        Returns: z.array(leaderboardEntrySchema)
      }
    }
  }
};

export type DatabaseType = typeof Database; 