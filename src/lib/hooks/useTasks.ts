import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '../../types';
import { getUserTasks, updateTaskStatus } from '../api/supabase';

export const useTasks = (userId: string | undefined) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedTasks = await getUserTasks(userId);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus);
      
      if (updatedTask) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
      return false;
    }
  }, []);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      task.status !== TaskStatus.COMPLETED && 
      task.dueDate < now
    );
  }, [tasks]);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    updateStatus,
    getTasksByStatus,
    getOverdueTasks
  };
};

export default useTasks; 