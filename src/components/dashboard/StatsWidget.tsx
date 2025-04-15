import React from 'react';
import { User } from '../../types';
import styles from './StatsWidget.module.css';

interface StatsWidgetProps {
  user: User | null;
  isLoading?: boolean;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ user, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading stats...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = [
    { label: 'Rank', value: `#${user.stats.rank}`, icon: '🏆' },
    { label: 'Tasks Completed', value: user.stats.tasksCompleted, icon: '✅' },
    { label: 'Completion Rate', value: `${user.stats.completionRate}%`, icon: '📊' },
    { label: 'Avg. Time', value: `${user.stats.averageCompletionTime.toFixed(1)}h`, icon: '⏱️' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsWidget; 