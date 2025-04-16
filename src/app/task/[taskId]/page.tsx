'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import { Task, TaskStatus } from '../../../types';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { getTaskById, updateTaskStatus } from '../../../lib/api/supabase';
import styles from './TaskDetail.module.css';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && taskId) {
      fetchTaskData();
    }
  }, [user, taskId]);

  const fetchTaskData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const taskData = await getTaskById(taskId as string);
      setTask(taskData);
    } catch (err) {
      console.error('Error fetching task data:', err);
      setError('Failed to load task data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      // Refresh task data
      fetchTaskData();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading task details...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.container}>
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchTaskData}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.container}>
            <div className={styles.errorMessage}>
              <p>Task not found</p>
              <Button variant="primary" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const isTaskAssignee = user?.id === task.assigneeId;
  const isTaskAssigner = user?.id === task.assignerId;
  const canUpdate = isTaskAssignee || isTaskAssigner;
  const isDue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{task.title}</h1>
            <div className={styles.meta}>
              <span className={`${styles.status} ${styles[task.status.toLowerCase()]}`}>
                {task.status}
              </span>
              {isDue && <span className={styles.overdueTag}>OVERDUE</span>}
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles.mainContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Description</h2>
                <p className={styles.description}>{task.description || 'No description provided.'}</p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Details</h2>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Due Date</span>
                    <span className={styles.detailValue}>
                      {new Date(task.dueDate).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Priority</span>
                    <span className={styles.detailValue}>{task.priority}</span>
                  </div>
                  
                  {task.estimatedTimeMinutes && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Estimated Time</span>
                      <span className={styles.detailValue}>{task.estimatedTimeMinutes} minutes</span>
                    </div>
                  )}
                  
                  {task.completedAt && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Completed At</span>
                      <span className={styles.detailValue}>
                        {new Date(task.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>People</h2>
                <div className={styles.people}>
                  <div className={styles.person}>
                    <span className={styles.personRole}>Assigned by</span>
                    <div className={styles.personInfo}>
                      {task.assigner?.avatarUrl && (
                        <img 
                          src={task.assigner.avatarUrl} 
                          alt={task.assigner.name} 
                          className={styles.avatar} 
                        />
                      )}
                      <span className={styles.personName}>{task.assigner?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className={styles.person}>
                    <span className={styles.personRole}>Assigned to</span>
                    <div className={styles.personInfo}>
                      {task.assignee?.avatarUrl && (
                        <img 
                          src={task.assignee.avatarUrl} 
                          alt={task.assignee.name} 
                          className={styles.avatar} 
                        />
                      )}
                      <span className={styles.personName}>{task.assignee?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sidebar}>
              <div className={styles.actions}>
                <h3 className={styles.actionsTitle}>Actions</h3>
                {canUpdate && (
                  <div className={styles.statusButtons}>
                    {task.status !== TaskStatus.PENDING && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleStatusChange(TaskStatus.PENDING)}
                        disabled={isUpdating}
                        className={styles.actionButton}
                      >
                        Mark as Pending
                      </Button>
                    )}
                    
                    {task.status !== TaskStatus.IN_PROGRESS && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                        disabled={isUpdating}
                        className={styles.actionButton}
                      >
                        Mark as In Progress
                      </Button>
                    )}
                    
                    {task.status !== TaskStatus.COMPLETED && (
                      <Button 
                        variant="primary"
                        onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                        disabled={isUpdating}
                        className={styles.actionButton}
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => router.back()}
                  className={styles.actionButton}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TaskDetailPage; 