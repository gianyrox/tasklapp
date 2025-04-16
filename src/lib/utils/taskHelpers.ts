import { Task, TaskStatus } from '../../types';
import { supabase } from '../api/supabase';

// Helper function to transform task data from Supabase format to our app format
export const transformTaskFromDb = (task: any): Task => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: new Date(task.created_at),
    dueDate: new Date(task.due_date),
    assignerId: task.assigner_id,
    assigneeId: task.assignee_id,
    status: task.status as TaskStatus,
    priority: task.priority,
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    estimatedTimeMinutes: task.estimated_time_minutes,
    actualTimeMinutes: task.actual_time_minutes,
    submissionDate: task.submission_date ? new Date(task.submission_date) : undefined,
    qualityRating: task.quality_rating,
    feedback: task.feedback,
    attachments: task.attachments ? task.attachments.map((attachment: any) => ({
      id: attachment.id,
      taskId: attachment.task_id,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      fileName: attachment.file_name,
      createdAt: new Date(attachment.created_at)
    })) : [],
    assigner: task.assigner ? {
      id: task.assigner.id,
      name: task.assigner.name,
      email: task.assigner.email,
      avatarUrl: task.assigner.avatar_url,
      createdAt: new Date(task.assigner.created_at || Date.now()),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email,
      avatarUrl: task.assignee.avatar_url,
      createdAt: new Date(task.assignee.created_at || Date.now()),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined
  };
};

// Function to get self-assigned tasks
export const getSelfAssignedTasks = async (userId: string): Promise<Task[]> => {
  // Use the Supabase client to get tasks where user is both assignee and assigner
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assignee_id', userId)
    .eq('assigner_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching self-assigned tasks:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
};

// Function to filter tasks from friends
export const filterTasksFromFriends = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId !== userId);
};

// Function to filter tasks assigned to others
export const filterTasksAssignedToOthers = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assignerId === userId && task.assigneeId !== userId);
};

// Function to filter self-assigned tasks
export const filterSelfAssignedTasks = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId === userId);
};

// Function to get all tasks assigned by the user to others
export const getTasksAssignedToOthers = async (userId: string): Promise<Task[]> => {
  // Use the Supabase client to get tasks where user is the assigner but not the assignee
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assigner_id', userId)
    .neq('assignee_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching tasks assigned to others:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
}; 