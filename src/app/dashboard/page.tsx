'use client';

import React from 'react';
import useTasks from '../../lib/hooks/useTasks';
import AppLayout from '../../components/layout/AppLayout';
import TaskList from '../../components/task/TaskList';
import { TaskStatus } from '../../types';
import styles from './Dashboard.module.css';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Board from '../../components/ui/Board';
import StatsWidget from '../../components/dashboard/StatsWidget';
import Button from '../../components/ui/Button';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, getTasksByStatus, getOverdueTasks, updateStatus, isLoading } = useTasks(user?.id);
  
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateStatus(taskId, newStatus);
  };

  const pendingTasks = getTasksByStatus(TaskStatus.PENDING);
  const inProgressTasks = getTasksByStatus(TaskStatus.IN_PROGRESS);
  const completedTasks = getTasksByStatus(TaskStatus.COMPLETED);
  const overdueTasks = getOverdueTasks();

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

          {/* Stats Widget */}
          <StatsWidget user={user} isLoading={isLoading} />

          {/* My Tasks Section */}
          <div className={styles.widgetsGrid}>
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <Board 
                title="Overdue Tasks" 
                isLoading={isLoading}
                className={styles.overdueBoard}
                actionButton={
                  <Button size="sm" variant="outline">View All</Button>
                }
              >
                <TaskList tasks={overdueTasks} onStatusChange={handleStatusChange} />
              </Board>
            )}

            {/* Tasks In Progress */}
            <Board 
              title="In Progress" 
              isLoading={isLoading}
              actionButton={
                <Button size="sm" variant="outline">View All</Button>
              }
              emptyState={
                <div className={styles.emptyState}>
                  <p>You don't have any tasks in progress</p>
                </div>
              }
            >
              <TaskList tasks={inProgressTasks} onStatusChange={handleStatusChange} />
            </Board>

            {/* Pending Tasks */}
            <Board 
              title="Pending Tasks" 
              isLoading={isLoading}
              actionButton={
                <Button size="sm" variant="outline">View All</Button>
              }
              emptyState={
                <div className={styles.emptyState}>
                  <p>You don't have any pending tasks</p>
                </div>
              }
            >
              <TaskList tasks={pendingTasks} onStatusChange={handleStatusChange} />
            </Board>

            {/* Recently Completed */}
            <Board 
              title="Recently Completed" 
              isLoading={isLoading}
              actionButton={
                <Button size="sm" variant="outline">View All</Button>
              }
              emptyState={
                <div className={styles.emptyState}>
                  <p>You haven't completed any tasks yet</p>
                </div>
              }
            >
              <TaskList tasks={completedTasks.slice(0, 3)} />
            </Board>
          </div>

          {/* Leaderboard Preview - can be expanded later */}
          <Board 
            title="Leaderboard" 
            isLoading={isLoading}
            actionButton={
              <Button size="sm" variant="outline">View Full Leaderboard</Button>
            }
          >
            <div className={styles.leaderboardPreview}>
              <p className={styles.leaderboardEmptyState}>
                When you connect with friends, you'll see their rankings here!
              </p>
            </div>
          </Board>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 