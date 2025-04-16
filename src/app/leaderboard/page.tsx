'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { getLeaderboard } from '../../lib/api/supabase';
import { LeaderboardEntry } from '../../types';

import styles from './Leaderboard.module.css';

// Leaderboard types
const LEADERBOARD_TYPES = [
  {
    id: 'tasks-completed',
    name: 'Tasks Completed',
    description: 'Users who have completed the most tasks',
    icon: '🏆',
  },
  {
    id: 'quality-rating',
    name: 'Quality Rating',
    description: 'Users with the highest average task quality rating',
    icon: '⭐',
  },
  {
    id: 'speed-demons',
    name: 'Speed Demons',
    description: 'Users with the fastest average task completion time',
    icon: '⚡',
  },
  {
    id: 'consistency',
    name: 'Most Consistent',
    description: 'Users who consistently complete tasks on time',
    icon: '📊',
  },
];

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeLeaderboard, setActiveLeaderboard] = useState(LEADERBOARD_TYPES[0].id);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeaderboardData(activeLeaderboard);
    }
  }, [user, activeLeaderboard]);

  const fetchLeaderboardData = async (leaderboardType: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const leaderboardData = await getLeaderboard();
      
      // Sort the leaderboard based on the type
      let sortedData = [...leaderboardData];
      
      switch (leaderboardType) {
        case 'tasks-completed':
          sortedData.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
          break;
        case 'quality-rating':
          sortedData.sort((a, b) => (b.avgQualityRating || 0) - (a.avgQualityRating || 0));
          break;
        case 'speed-demons':
          // Lower completion time is better
          sortedData.sort((a, b) => (a.avgCompletionTime || Infinity) - (b.avgCompletionTime || Infinity));
          break;
        case 'consistency':
          // Lower overdue count is better
          sortedData.sort((a, b) => a.tasksOverdue - b.tasksOverdue);
          break;
        default:
          sortedData.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
      }
      
      setEntries(sortedData);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (leaderboardId: string) => {
    router.push(`/leaderboard/${leaderboardId}`);
  };

  // Helper to get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Format time in minutes to a readable format
  const formatTime = (minutes?: number) => {
    if (minutes === undefined) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
  };

  // Format quality rating
  const formatRating = (rating?: number) => {
    if (rating === undefined) return 'N/A';
    return rating.toFixed(1) + ' / 5';
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Leaderboards</h1>
            <p className={styles.subtitle}>See who's leading in different categories</p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
              <Button 
                size="sm" 
                variant="primary" 
                onClick={() => fetchLeaderboardData(activeLeaderboard)}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Leaderboard Types */}
          <div className={styles.leaderboardTypes}>
            {LEADERBOARD_TYPES.map(type => (
              <div 
                key={type.id}
                className={`${styles.leaderboardTypeCard} ${activeLeaderboard === type.id ? styles.active : ''}`}
                onClick={() => setActiveLeaderboard(type.id)}
              >
                <div className={styles.leaderboardIcon}>{type.icon}</div>
                <h3>{type.name}</h3>
                <p>{type.description}</p>
              </div>
            ))}
          </div>

          {/* Current Leaderboard */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                {LEADERBOARD_TYPES.find(t => t.id === activeLeaderboard)?.name} Leaderboard
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewDetails(activeLeaderboard)}
              >
                View Details
              </Button>
            </div>

            {isLoading ? (
              <div className={styles.loading}>Loading leaderboard data...</div>
            ) : entries.length > 0 ? (
              <div className={styles.leaderboardTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankColumn}>Rank</div>
                  <div className={styles.userColumn}>User</div>
                  <div className={styles.statsColumn}>
                    {activeLeaderboard === 'tasks-completed' && 'Tasks Completed'}
                    {activeLeaderboard === 'quality-rating' && 'Avg. Quality'}
                    {activeLeaderboard === 'speed-demons' && 'Avg. Time'}
                    {activeLeaderboard === 'consistency' && 'Tasks Overdue'}
                  </div>
                  <div className={styles.extendedStatsColumn}></div>
                  <div className={styles.actionColumn}></div>
                </div>
                
                {entries.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`${styles.tableRow} ${entry.id === user?.id ? styles.currentUser : ''}`}
                  >
                    <div className={styles.rankColumn}>
                      {index === 0 && <span className={styles.goldMedal}>🥇</span>}
                      {index === 1 && <span className={styles.silverMedal}>🥈</span>}
                      {index === 2 && <span className={styles.bronzeMedal}>🥉</span>}
                      {index > 2 && <span className={styles.rank}>#{index + 1}</span>}
                    </div>
                    <div className={styles.userColumn}>
                      <div className={styles.userAvatarContainer}>
                        {entry.avatarUrl ? (
                          <img 
                            src={entry.avatarUrl} 
                            alt={entry.name} 
                            className={styles.userAvatar} 
                          />
                        ) : (
                          <div className={styles.userAvatarPlaceholder}>
                            {getUserInitials(entry.name)}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4 className={styles.userName}>
                          {entry.name}
                          {entry.isFriend && <span className={styles.friendBadge}>Friend</span>}
                          {entry.id === user?.id && <span className={styles.youBadge}>You</span>}
                        </h4>
                      </div>
                    </div>
                    <div className={styles.statsColumn}>
                      {activeLeaderboard === 'tasks-completed' && (
                        <div className={styles.statValue}>{entry.tasksCompleted}</div>
                      )}
                      {activeLeaderboard === 'quality-rating' && (
                        <div className={styles.statValue}>{formatRating(entry.avgQualityRating)}</div>
                      )}
                      {activeLeaderboard === 'speed-demons' && (
                        <div className={styles.statValue}>{formatTime(entry.avgCompletionTime)}</div>
                      )}
                      {activeLeaderboard === 'consistency' && (
                        <div className={styles.statValue}>{entry.tasksOverdue}</div>
                      )}
                    </div>
                    <div className={styles.extendedStatsColumn}>
                      {activeLeaderboard === 'tasks-completed' && entry.avgQualityRating && (
                        <div className={styles.miniStat}>
                          <span className={styles.miniStatLabel}>Quality:</span>
                          <span className={styles.miniStatValue}>{formatRating(entry.avgQualityRating)}</span>
                        </div>
                      )}
                      {activeLeaderboard === 'quality-rating' && entry.avgTimelinessRating && (
                        <div className={styles.miniStat}>
                          <span className={styles.miniStatLabel}>Timeliness:</span>
                          <span className={styles.miniStatValue}>{formatRating(entry.avgTimelinessRating)}</span>
                        </div>
                      )}
                      {activeLeaderboard === 'quality-rating' && entry.avgEffortRating && (
                        <div className={styles.miniStat}>
                          <span className={styles.miniStatLabel}>Effort:</span>
                          <span className={styles.miniStatValue}>{formatRating(entry.avgEffortRating)}</span>
                        </div>
                      )}
                      {activeLeaderboard === 'speed-demons' && (
                        <div className={styles.miniStat}>
                          <span className={styles.miniStatLabel}>Tasks:</span>
                          <span className={styles.miniStatValue}>{entry.tasksCompleted}</span>
                        </div>
                      )}
                      {activeLeaderboard === 'consistency' && entry.avgQualityRating && (
                        <div className={styles.miniStat}>
                          <span className={styles.miniStatLabel}>Quality:</span>
                          <span className={styles.miniStatValue}>{formatRating(entry.avgQualityRating)}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.actionColumn}>
                      {entry.id !== user?.id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/user/${entry.id}`)}
                        >
                          View Profile
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No leaderboard data available yet.</p>
                <p>Complete tasks to start competing!</p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default LeaderboardPage; 