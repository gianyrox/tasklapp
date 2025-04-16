import React from 'react';
import styles from './StatsSection.module.css';
import { Task, TaskStatus } from '../../types';

interface StatsSectionProps {
  tasks: Task[];
  isLoading: boolean;
}

const StatsSection: React.FC<StatsSectionProps> = ({ tasks, isLoading }) => {
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
  const pendingTasks = tasks.filter(task => task.status === TaskStatus.PENDING).length;
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return (
      task.status !== TaskStatus.COMPLETED && 
      dueDate < new Date() && 
      dueDate.getTime() !== 0
    );
  }).length;
  
  return (
    <div className={styles.statsSection}>
      <h2 className={styles.sectionTitle}>Stats Overview</h2>
      
      {isLoading ? (
        <div className={styles.loadingSpinner}></div>
      ) : (
        <div className={styles.statsGrid}>
          <div className={styles.statsCard}>
            <h3>Total Tasks</h3>
            <div className={styles.statValue}>{totalTasks}</div>
            <p className={styles.statDescription}>
              Tasks assigned to you
            </p>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Completed</h3>
            <div className={styles.statValue}>{completedTasks}</div>
            <p className={styles.statDescription}>
              Tasks completed
            </p>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Completion Rate</h3>
            <div className={styles.statValue}>{completionRate}%</div>
            <p className={styles.statDescription}>
              Task completion ratio
            </p>
          </div>
          
          <div className={styles.statsCard}>
            <h3>In Progress</h3>
            <div className={styles.statValue}>{inProgressTasks}</div>
            <p className={styles.statDescription}>
              Tasks you're working on
            </p>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Pending</h3>
            <div className={styles.statValue}>{pendingTasks}</div>
            <p className={styles.statDescription}>
              Tasks to be started
            </p>
          </div>
          
          <div className={`${styles.statsCard} ${overdueTasks > 0 ? styles.overdueCard : ''}`}>
            <h3>Overdue</h3>
            <div className={styles.statValue}>{overdueTasks}</div>
            <p className={styles.statDescription}>
              Tasks past due date
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection; 