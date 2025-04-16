import React from 'react';
import styles from './LeaderboardSection.module.css';
import Link from 'next/link';
import Button from '../ui/Button';
import { LeaderboardEntry } from '../../types';

interface LeaderboardSectionProps {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId: string | undefined;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  leaderboard,
  isLoading,
  currentUserId
}) => {
  // Display only top 3 entries for the preview
  const topEntries = leaderboard.slice(0, 3);
  
  return (
    <div className={styles.leaderboardSection}>
      <div className={styles.sectionHeader}>
        <h2>Leaderboard</h2>
        <Link href="/leaderboard">
          <Button variant="outline" size="sm">View Full Leaderboard</Button>
        </Link>
      </div>
      
      <div className={styles.leaderboardBoard}>
        {isLoading ? (
          <div className={styles.loadingSpinner}></div>
        ) : topEntries.length > 0 ? (
          <div className={styles.leaderboardPreview}>
            {topEntries.map((entry, index) => (
              <div 
                key={entry.userId} 
                className={`${styles.leaderboardEntry} ${
                  entry.userId === currentUserId ? styles.currentUser : 
                  entry.isFriend ? styles.friendUser : ''
                }`}
              >
                <span className={styles.leaderboardRank}>{index + 1}</span>
                <div className={styles.leaderboardUser}>
                  <div className={styles.leaderboardAvatar}>
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.name} />
                    ) : (
                      entry.name.charAt(0)
                    )}
                  </div>
                  <span className={`${styles.leaderboardName} ${
                    entry.userId === currentUserId ? styles.leaderboardCurrentUser : ''
                  }`}>
                    {entry.name}
                    {entry.userId === currentUserId && ' (You)'}
                  </span>
                </div>
                <div className={styles.leaderboardStats}>
                  <div className={styles.leaderboardStat}>
                    <span className={styles.leaderboardStatValue}>{entry.tasksCompleted}</span>
                    <span className={styles.leaderboardStatLabel}>Tasks</span>
                  </div>
                  <div className={styles.leaderboardStat}>
                    <span className={styles.leaderboardStatValue}>
                      {Math.round(entry.completionRate * 100)}%
                    </span>
                    <span className={styles.leaderboardStatLabel}>Rate</span>
                  </div>
                  <div className={styles.leaderboardStat}>
                    <span className={styles.leaderboardStatValue}>
                      {Math.round(entry.averageCompletionTime / 60)}h
                    </span>
                    <span className={styles.leaderboardStatLabel}>Avg Time</span>
                  </div>
                </div>
              </div>
            ))}
            
            <Link href="/leaderboard" className={styles.viewMoreLink}>
              View more rankings
            </Link>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No leaderboard data available yet.</p>
            <p className={styles.emptyStateSubtext}>
              Complete tasks to start appearing on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSection; 