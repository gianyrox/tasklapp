import { createClient } from '@supabase/supabase-js';
import { Task, TaskStatus, TaskPriority, User, UserStats } from '../../types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// User API functions
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*, stats:user_stats(*)')
    .eq('id', session.user.id)
    .single();
    
  if (error || !data) {
    console.error('Error fetching current user:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at),
    stats: {
      tasksCompleted: data.stats.tasks_completed,
      tasksAssigned: data.stats.tasks_assigned,
      averageCompletionTime: data.stats.average_completion_time,
      completionRate: data.stats.completion_rate,
      rank: data.stats.rank
    }
  };
};

export const updateUserProfile = async (data: {
  name?: string;
  avatarUrl?: string;
}): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Update auth.users metadata
    await supabase.auth.updateUser({
      data: {
        name: data.name,
        avatar_url: data.avatarUrl
      }
    });

    // Update public profile
    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        avatar_url: data.avatarUrl
      })
      .eq('id', session.user.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*, stats:user_stats(*)')
    .order('name');
    
  if (error || !data) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    createdAt: new Date(user.created_at),
    stats: {
      tasksCompleted: user.stats.tasks_completed,
      tasksAssigned: user.stats.tasks_assigned,
      averageCompletionTime: user.stats.average_completion_time,
      completionRate: user.stats.completion_rate,
      rank: user.stats.rank
    }
  }));
};

// Task API functions
export const getUserTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description,
      due_date: task.dueDate.toISOString(),
      assigner_id: task.assignerId,
      assignee_id: task.assigneeId,
      status: task.status,
      priority: task.priority,
      completed_at: task.completedAt?.toISOString()
    })
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
};

export const updateTaskStatus = async (
  taskId: string, 
  status: TaskStatus, 
  completedAt?: Date
): Promise<Task | null> => {
  const updateData: any = { status };
  
  if (status === TaskStatus.COMPLETED && !completedAt) {
    updateData.completed_at = new Date().toISOString();
  } else if (completedAt) {
    updateData.completed_at = completedAt.toISOString();
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error updating task status:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
};

// Helper functions
const transformTaskFromDb = (task: any): Task => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: new Date(task.created_at),
    dueDate: new Date(task.due_date),
    assignerId: task.assigner_id,
    assigneeId: task.assignee_id,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined
  };
}; 