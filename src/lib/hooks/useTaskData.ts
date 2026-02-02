'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskPriority, SubmissionType } from '../../../confy/types';
import { supabase } from '../api/supabase';
import { useLogging } from '../../context/LoggingContext';
import { LogCategory } from '../../../confy/types';

// Define the database record type
interface TaskDBRecord {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  due_date: string;
  assigner_id: string;
  assignee_id: string;
  status: string;
  priority: string;
  completed_at: string | null;
  estimated_time_minutes: number | null;
  actual_time_minutes: number | null;
  submission_type: string | null;
  submission_instructions: string | null;
  started_at: string | null;
  submission_date: string | null;
  submission_content: string | null;
  quality_rating: number | null;
  timeliness_rating: number | null;
  effort_rating: number | null;
  accuracy_rating: number | null;
  feedback: string | null;
}

export function useTaskData(userId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { log } = useLogging();

  // Function to load task data
  const loadTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await log({
        category: LogCategory.DATA,
        action: 'tasks_loading',
        details: { userId }
      });

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .or(`assignee_id.eq.${userId},assigner_id.eq.${userId}`)
        .order('due_date', { ascending: true })
        .returns<TaskDBRecord[]>();

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to application types
      const transformedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        createdAt: new Date(task.created_at),
        dueDate: new Date(task.due_date),
        assignerId: task.assigner_id,
        assigneeId: task.assignee_id,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        estimatedTimeMinutes: task.estimated_time_minutes || undefined,
        actualTimeMinutes: task.actual_time_minutes || undefined,
        submissionType: task.submission_type as SubmissionType | undefined,
        submissionInstructions: task.submission_instructions || undefined,
        startedAt: task.started_at ? new Date(task.started_at) : undefined,
        submissionDate: task.submission_date ? new Date(task.submission_date) : undefined,
        submissionContent: task.submission_content || undefined,
        qualityRating: task.quality_rating || undefined,
        timelinessRating: task.timeliness_rating || undefined,
        effortRating: task.effort_rating || undefined,
        accuracyRating: task.accuracy_rating || undefined,
        feedback: task.feedback || undefined
      }));

      setTasks(transformedTasks);
      
      await log({
        category: LogCategory.DATA,
        action: 'tasks_loaded',
        details: { count: transformedTasks.length }
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
  }, [userId, log]);

  // Load tasks on mount and when userId changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Function to refresh tasks
  const refreshTasks = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    isLoading,
    error,
    refreshTasks
  };
} 