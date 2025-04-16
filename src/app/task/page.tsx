'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { Task, TaskStatus } from '../../types';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { getUserTasks, getUserAssignedTasks } from '../../lib/api/supabase';
import styles from './TasksPage.module.css';

const TasksPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [friendTasks, setFriendTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('active');
  const [viewMode, setViewMode] = useState<string>('my-tasks');

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all tasks for the current user
      const userTasks = await getUserTasks(user!.id);
      setTasks(userTasks);
      
      // Get tasks assigned by the current user to others
      const assignedTasks = await getUserAssignedTasks(user!.id);
      setFriendTasks(assignedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const getFilteredTasks = () => {
    // First filter by active/archived tab
    let filteredTasks = tasks;
    
    if (activeTab === 'active') {
      filteredTasks = tasks.filter(task => 
        task.status !== TaskStatus.COMPLETED && 
        task.status !== TaskStatus.GRADED
      );
    } else if (activeTab === 'archived') {
      filteredTasks = tasks.filter(task => 
        task.status === TaskStatus.COMPLETED || 
        task.status === TaskStatus.GRADED
      );
    }
    
    // Then filter by status if not showing 'all'
    if (activeFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === activeFilter);
    }
    
    return filteredTasks;
  };

  const getTasks = (status: TaskStatus | 'all'): Task[] => {
    if (status === 'all') {
      return getFilteredTasks();
    } else {
      return getFilteredTasks().filter(task => task.status === status);
    }
  };

  const getFilteredFriendTasks = () => {
    let filteredTasks = friendTasks;
    
    // Apply active/archived tab filter
    if (activeTab === 'active') {
      filteredTasks = friendTasks.filter(task => 
        task.status !== TaskStatus.COMPLETED && 
        task.status !== TaskStatus.GRADED
      );
    } else if (activeTab === 'archived') {
      filteredTasks = friendTasks.filter(task => 
        task.status === TaskStatus.COMPLETED || 
        task.status === TaskStatus.GRADED
      );
    }
    
    // Then filter by status if not showing 'all'
    if (activeFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === activeFilter);
    }
    
    return filteredTasks;
  };

  const getFriendTasks = (status: TaskStatus | 'all'): Task[] => {
    if (status === 'all') {
      return getFilteredFriendTasks();
    } else {
      return getFilteredFriendTasks().filter(task => task.status === status);
    }
  };

  const renderTaskCard = (task: Task) => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.GRADED;
    const statusClass = task.status.toLowerCase();
    
    return (
      <div 
        key={task.id} 
        className={`${styles.taskCard} ${styles[statusClass]} ${isOverdue ? styles.overdue : ''}`}
        onClick={() => handleTaskClick(task.id)}
      >
        <div className={styles.taskHeader}>
          <h3 className={styles.taskTitle}>{task.title}</h3>
          <span className={`${styles.taskStatus} ${styles[statusClass]}`}>{task.status}</span>
        </div>
        
        <div className={styles.taskDetails}>
          <div className={styles.taskDetail}>
            <span className={styles.detailLabel}>Due</span>
            <span className={styles.detailValue}>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
          
          <div className={styles.taskDetail}>
            <span className={styles.detailLabel}>Priority</span>
            <span className={styles.detailValue}>{task.priority}</span>
          </div>
          
          {task.qualityRating && (
            <div className={styles.taskDetail}>
              <span className={styles.detailLabel}>Rating</span>
              <span className={styles.detailValue}>
                {task.qualityRating}/5
                {task.timelinessRating && task.effortRating && task.accuracyRating && (
                  <span className={styles.avgRating}>
                    (Avg: {((task.qualityRating + (task.timelinessRating || 0) + (task.effortRating || 0) + (task.accuracyRating || 0)) / 4).toFixed(1)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        
        <div className={styles.taskMeta}>
          {task.assignee && (
            <div className={styles.assigneeInfo}>
              {task.assignee.avatarUrl ? (
                <img 
                  src={task.assignee.avatarUrl} 
                  alt={task.assignee.name} 
                  className={styles.assigneeAvatar} 
                />
              ) : (
                <div className={styles.assigneeInitial}>
                  {task.assignee.name.charAt(0)}
                </div>
              )}
              <span>Assigned to: {task.assignee.name}</span>
            </div>
          )}
          
          {task.assigner && (
            <div className={styles.assignerInfo}>
              {task.assigner.avatarUrl ? (
                <img 
                  src={task.assigner.avatarUrl} 
                  alt={task.assigner.name} 
                  className={styles.assignerAvatar} 
                />
              ) : (
                <div className={styles.assignerInitial}>
                  {task.assigner.name.charAt(0)}
                </div>
              )}
              <span>From: {task.assigner.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
      return (
        <div className={styles.emptyState}>
          <h3>No tasks found</h3>
          <p>No tasks match your current filters.</p>
        </div>
      );
    }
    
    if (activeFilter === 'all') {
      // Group by status when showing all
      return (
        <div className={styles.taskSections}>
          <div className={styles.taskSection}>
            <h2 className={styles.sectionTitle}>Pending</h2>
            <div className={styles.taskCards}>
              {getTasks(TaskStatus.PENDING).map(renderTaskCard)}
              {getTasks(TaskStatus.PENDING).length === 0 && (
                <p className={styles.noTasksMessage}>No pending tasks</p>
              )}
            </div>
          </div>
          
          <div className={styles.taskSection}>
            <h2 className={styles.sectionTitle}>In Progress</h2>
            <div className={styles.taskCards}>
              {getTasks(TaskStatus.IN_PROGRESS).map(renderTaskCard)}
              {getTasks(TaskStatus.IN_PROGRESS).length === 0 && (
                <p className={styles.noTasksMessage}>No tasks in progress</p>
              )}
            </div>
          </div>
          
          {activeTab === 'active' && (
            <div className={styles.taskSection}>
              <h2 className={styles.sectionTitle}>Need Grading</h2>
              <div className={styles.taskCards}>
                {tasks
                  .filter(task => task.status === TaskStatus.COMPLETED && !task.qualityRating)
                  .map(renderTaskCard)}
                {tasks.filter(task => task.status === TaskStatus.COMPLETED && !task.qualityRating).length === 0 && (
                  <p className={styles.noTasksMessage}>No tasks need grading</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'archived' && (
            <div className={styles.taskSection}>
              <h2 className={styles.sectionTitle}>Graded</h2>
              <div className={styles.taskCards}>
                {getTasks(TaskStatus.GRADED).map(renderTaskCard)}
                {getTasks(TaskStatus.GRADED).length === 0 && (
                  <p className={styles.noTasksMessage}>No graded tasks</p>
                )}
              </div>
            </div>
          )}
          
          <div className={styles.taskSection}>
            <h2 className={styles.sectionTitle}>Overdue</h2>
            <div className={styles.taskCards}>
              {getTasks(TaskStatus.OVERDUE).map(renderTaskCard)}
              {tasks
                .filter(task => 
                  new Date(task.dueDate) < new Date() && 
                  task.status !== TaskStatus.COMPLETED &&
                  task.status !== TaskStatus.GRADED
                )
                .map(renderTaskCard)}
              {getTasks(TaskStatus.OVERDUE).length === 0 && 
               tasks.filter(task => 
                 new Date(task.dueDate) < new Date() && 
                 task.status !== TaskStatus.COMPLETED &&
                 task.status !== TaskStatus.GRADED
               ).length === 0 && (
                <p className={styles.noTasksMessage}>No overdue tasks</p>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // Just show the filtered tasks
      return (
        <div className={styles.taskCards}>
          {filteredTasks.map(renderTaskCard)}
        </div>
      );
    }
  };

  const renderFriendTasksContent = () => {
    const filteredTasks = getFilteredFriendTasks();
    
    if (filteredTasks.length === 0) {
      return (
        <div className={styles.emptyState}>
          <h3>No tasks found</h3>
          <p>You haven't assigned any tasks to friends that match your current filters.</p>
        </div>
      );
    }
    
    if (activeFilter === 'all') {
      // Group by status when showing all
      return (
        <div className={styles.taskSections}>
          <div className={styles.taskSection}>
            <h2 className={styles.sectionTitle}>Pending</h2>
            <div className={styles.taskCards}>
              {getFriendTasks(TaskStatus.PENDING).map(renderTaskCard)}
              {getFriendTasks(TaskStatus.PENDING).length === 0 && (
                <p className={styles.noTasksMessage}>No pending tasks</p>
              )}
            </div>
          </div>
          
          <div className={styles.taskSection}>
            <h2 className={styles.sectionTitle}>In Progress</h2>
            <div className={styles.taskCards}>
              {getFriendTasks(TaskStatus.IN_PROGRESS).map(renderTaskCard)}
              {getFriendTasks(TaskStatus.IN_PROGRESS).length === 0 && (
                <p className={styles.noTasksMessage}>No tasks in progress</p>
              )}
            </div>
          </div>
          
          {activeTab === 'active' && (
            <div className={styles.taskSection}>
              <h2 className={styles.sectionTitle}>Need Grading</h2>
              <div className={styles.taskCards}>
                {friendTasks
                  .filter(task => task.status === TaskStatus.COMPLETED && !task.qualityRating)
                  .map(renderTaskCard)}
                {friendTasks.filter(task => task.status === TaskStatus.COMPLETED && !task.qualityRating).length === 0 && (
                  <p className={styles.noTasksMessage}>No tasks need grading</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'archived' && (
            <div className={styles.taskSection}>
              <h2 className={styles.sectionTitle}>Graded</h2>
              <div className={styles.taskCards}>
                {getFriendTasks(TaskStatus.GRADED).map(renderTaskCard)}
                {getFriendTasks(TaskStatus.GRADED).length === 0 && (
                  <p className={styles.noTasksMessage}>No graded tasks</p>
                )}
              </div>
            </div>
          )}
          
          <div className={styles.taskSection}>
            <h2 className={styles.sectionTitle}>Overdue</h2>
            <div className={styles.taskCards}>
              {getFriendTasks(TaskStatus.OVERDUE).map(renderTaskCard)}
              {friendTasks
                .filter(task => 
                  new Date(task.dueDate) < new Date() && 
                  task.status !== TaskStatus.COMPLETED &&
                  task.status !== TaskStatus.GRADED
                )
                .map(renderTaskCard)}
              {getFriendTasks(TaskStatus.OVERDUE).length === 0 && 
               friendTasks.filter(task => 
                 new Date(task.dueDate) < new Date() && 
                 task.status !== TaskStatus.COMPLETED &&
                 task.status !== TaskStatus.GRADED
               ).length === 0 && (
                <p className={styles.noTasksMessage}>No overdue tasks</p>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // Just show the filtered tasks
      return (
        <div className={styles.taskCards}>
          {filteredTasks.map(renderTaskCard)}
        </div>
      );
    }
  };

  const renderTaskMode = () => {
    if (viewMode === 'my-tasks') {
      return renderContent();
    } else {
      return renderFriendTasksContent();
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading tasks...</p>
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
              <Button variant="primary" onClick={fetchTasks}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>
                {viewMode === 'my-tasks' ? 'My Tasks' : 'Tasks I\'ve Assigned'}
              </h1>
            </div>
          </div>
          
          <div className={styles.viewModeContainer}>
            <div className={styles.viewModes}>
              <button 
                className={`${styles.viewMode} ${viewMode === 'my-tasks' ? styles.activeViewMode : ''}`}
                onClick={() => setViewMode('my-tasks')}
              >
                My Tasks
              </button>
              <button 
                className={`${styles.viewMode} ${viewMode === 'friend-tasks' ? styles.activeViewMode : ''}`}
                onClick={() => setViewMode('friend-tasks')}
              >
                Friend Tasks I've Assigned
              </button>
            </div>
          </div>
          
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'active' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Tasks
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'archived' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('archived')}
              >
                Archive
              </button>
            </div>
          </div>
          
          <div className={styles.filtersContainer}>
            <div className={styles.filters}>
              <button 
                className={`${styles.filter} ${activeFilter === 'all' ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button 
                className={`${styles.filter} ${activeFilter === TaskStatus.PENDING ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter(TaskStatus.PENDING)}
              >
                Pending
              </button>
              <button 
                className={`${styles.filter} ${activeFilter === TaskStatus.IN_PROGRESS ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter(TaskStatus.IN_PROGRESS)}
              >
                In Progress
              </button>
              <button 
                className={`${styles.filter} ${activeFilter === TaskStatus.COMPLETED ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter(TaskStatus.COMPLETED)}
              >
                Completed
              </button>
              <button 
                className={`${styles.filter} ${activeFilter === TaskStatus.GRADED ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter(TaskStatus.GRADED)}
              >
                Graded
              </button>
            </div>
          </div>
          
          {renderTaskMode()}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TasksPage; 