import { supabase } from './supabase';

export interface TaskAssignmentNotificationData {
  assigneeEmail: string;
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  taskId: string;
}

/**
 * Sends a task assignment notification email via Supabase Edge Function
 */
export const sendTaskAssignmentNotification = async (
  notificationData: TaskAssignmentNotificationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('notify-task-assignment', {
      body: notificationData,
    });

    if (error) {
      console.error('Error calling notification function:', error);
      return { success: false, error: error.message || 'Failed to send notification' };
    }

    if (data?.error) {
      console.error('Error from notification function:', data.error);
      return { success: false, error: data.error };
    }

    console.log('Notification sent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error sending notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Helper function to extract notification data from task and user objects
 */
export const createTaskAssignmentNotificationData = (
  task: {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
  },
  assignee: {
    name: string;
    email: string;
  },
  assigner: {
    name: string;
  }
): TaskAssignmentNotificationData => {
  return {
    assigneeEmail: assignee.email,
    assigneeName: assignee.name,
    assignerName: assigner.name,
    taskTitle: task.title,
    taskDescription: task.description,
    dueDate: task.dueDate.toISOString(),
    taskId: task.id,
  };
}; 