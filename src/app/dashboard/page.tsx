'use client';

import React from 'react';
import useTasks from '../../lib/hooks/useTasks';
import AppLayout from '../../components/layout/AppLayout';
import TaskCard from '../../components/task/TaskCard';
import { TaskStatus } from '../../types';
import styles from './Dashboard.module.css';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, getTasksByStatus, getOverdueTasks, updateStatus, isLoading } = useTasks(user?.id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  const pendingTasks = getTasksByStatus(TaskStatus.PENDING);
  const inProgressTasks = getTasksByStatus(TaskStatus.IN_PROGRESS);
  const completedTasks = getTasksByStatus(TaskStatus.COMPLETED);
  const overdueTasks = getOverdueTasks();

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateStatus(taskId, newStatus);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <h1>Dashboard</h1>
            <p className={styles.welcomeMessage}>
              Welcome back, <span className={styles.userName}>{user?.name}</span>
            </p>
          </div>

          <div className={styles.statsContainer}>
            <div className={styles.statsCard}>
              <h3>Tasks Completed</h3>
              <div className={styles.statValue}>{user?.stats.tasksCompleted}</div>
            </div>
            <div className={styles.statsCard}>
              <h3>Completion Rate</h3>
              <div className={styles.statValue}>{user?.stats.completionRate}%</div>
            </div>
            <div className={styles.statsCard}>
              <h3>Current Rank</h3>
              <div className={styles.statValue}>#{user?.stats.rank}</div>
            </div>
            <div className={styles.statsCard}>
              <h3>Avg. Completion Time</h3>
              <div className={styles.statValue}>{user?.stats.averageCompletionTime.toFixed(1)}h</div>
            </div>
          </div>

          {overdueTasks.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.overdueIndicator}>Overdue Tasks</span>
              </h2>
              <div className={styles.tasksList}>
                {overdueTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>In Progress</h2>
            <div className={styles.tasksList}>
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <p className={styles.emptyState}>No tasks in progress</p>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pending Tasks</h2>
            <div className={styles.tasksList}>
              {pendingTasks.length > 0 ? (
                pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <p className={styles.emptyState}>No pending tasks</p>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recently Completed</h2>
            <div className={styles.tasksList}>
              {completedTasks.slice(0, 3).length > 0 ? (
                completedTasks.slice(0, 3).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                  />
                ))
              ) : (
                <p className={styles.emptyState}>No completed tasks</p>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 