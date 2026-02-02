'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, SubmissionType, LogCategory } from '../../confy/types';
import { supabase } from '../lib/api/supabase';
import { useAuth } from './AuthContext';
import { useLogging } from './LoggingContext';

type TaskContextType = {
  tasks: Task[];
  assignedToMe: Task[];
  assignedByMe: Task[];
  isLoading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<boolean>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { log } = useLogging();
  
  // Filter helper functions
  const assignedToMe = tasks.filter(task => task.assigneeId === user?.id);
  const assignedByMe = tasks.filter(task => task.assignerId === user?.id);
  
  // Load tasks from the database
  const loadTasks = useCallback(async () => {
    if (!user?.id) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await log({
        category: LogCategory.TASK,
        action: 'tasks_loading',
        details: { userId: user.id }
      });
      
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .or(`assignee_id.eq.${user.id},assigner_id.eq.${user.id}`)
        .order('due_date', { ascending: true });
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Transform data to application types
      const transformedTasks = data.map(task => ({
        id: task.id as string,
        title: task.title as string,
        description: task.description as string || '',
        createdAt: new Date(task.created_at as string),
        dueDate: new Date(task.due_date as string),
        assignerId: task.assigner_id as string,
        assigneeId: task.assignee_id as string,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        completedAt: task.completed_at ? new Date(task.completed_at as string) : undefined,
        estimatedTimeMinutes: task.estimated_time_minutes as number | undefined,
        actualTimeMinutes: task.actual_time_minutes as number | undefined,
        submissionType: task.submission_type as SubmissionType | undefined,
        submissionInstructions: task.submission_instructions as string | undefined,
        startedAt: task.started_at ? new Date(task.started_at as string) : undefined,
        submissionDate: task.submission_date ? new Date(task.submission_date as string) : undefined,
        submissionContent: task.submission_content as string | undefined,
        qualityRating: task.quality_rating as number | undefined,
        timelinessRating: task.timeliness_rating as number | undefined,
        effortRating: task.effort_rating as number | undefined,
        accuracyRating: task.accuracy_rating as number | undefined,
        feedback: task.feedback as string | undefined
      })) as Task[];
      
      setTasks(transformedTasks);
      
      await log({
        category: LogCategory.TASK,
        action: 'tasks_loaded',
        details: { 
          count: transformedTasks.length,
          assignedToMe: transformedTasks.filter(task => task.assigneeId === user.id).length,
          assignedByMe: transformedTasks.filter(task => task.assignerId === user.id).length 
        }
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
      
      await log({
        category: LogCategory.ERROR,
        action: 'tasks_load_failed',
        details: { error: String(err) }
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, log]);
  
  // Get a task by ID
  const getTaskById = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);
  
  // Update a task's status
  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    if (!user?.id) return false;
    
    try {
      await log({
        category: LogCategory.TASK,
        action: 'task_status_update_started',
        details: { taskId: id, newStatus: status }
      });
      
      const task = tasks.find(t => t.id === id);
      if (!task) {
        throw new Error('Task not found');
      }
      
      const updates: any = { status };
      
      // Add additional fields based on status
      if (status === TaskStatus.IN_PROGRESS && !task.startedAt) {
        updates.started_at = new Date().toISOString();
      } else if (status === TaskStatus.COMPLETED && !task.completedAt) {
        updates.completed_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === id 
            ? { 
                ...t, 
                status, 
                startedAt: updates.started_at ? new Date(updates.started_at) : t.startedAt,
                completedAt: updates.completed_at ? new Date(updates.completed_at) : t.completedAt
              } 
            : t
        )
      );
      
      await log({
        category: LogCategory.TASK,
        action: 'task_status_updated',
        details: { 
          taskId: id, 
          oldStatus: task.status, 
          newStatus: status,
          taskTitle: task.title
        }
      });
      
      return true;
    } catch (err) {
      console.error('Error updating task status:', err);
      
      await log({
        category: LogCategory.ERROR,
        action: 'task_status_update_failed',
        details: { taskId: id, status, error: String(err) }
      });
      
      return false;
    }
  }, [user?.id, tasks, log]);
  
  // Public refresh function
  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);
  
  // Load tasks on mount and when user changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  
  return (
    <TaskContext.Provider 
      value={{ 
        tasks, 
        assignedToMe, 
        assignedByMe, 
        isLoading, 
        error, 
        refreshTasks,
        getTaskById,
        updateTaskStatus
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  
  return context;
} 