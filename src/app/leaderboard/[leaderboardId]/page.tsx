'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { getLeaderboardDetail } from '../../../lib/api/supabase';
import { LeaderboardEntry } from '../../../types';
import { FaTrophy, FaArrowLeft, FaMedal, FaCheckCircle, FaCalendarAlt, FaStopwatch } from 'react-icons/fa';
import { MdTimer, MdOutlineStar, MdLocalFireDepartment, MdTaskAlt } from 'react-icons/md';
import Link from 'next/link';

import styles from './LeaderboardDetail.module.css';

// Leaderboard type definitions - should match the ones on the main page
const LEADERBOARD_TYPES = {
  'tasks-completed': {
    id: 'tasks-completed',
    name: 'Tasks Completed',
    description: 'Users who have completed the most tasks',
    icon: <MdTaskAlt />,
    statKey: 'tasksCompleted',
    statLabel: 'Tasks Completed',
    higherIsBetter: true,
    format: (value: number) => `${value}`
  },
  'quality-rating': {
    id: 'quality-rating',
    name: 'Quality Rating',
    description: 'Users with the highest average task quality rating',
    icon: <MdOutlineStar />,
    statKey: 'avgQualityRating',
    statLabel: 'Avg. Quality Rating',
    higherIsBetter: true,
    format: (value?: number) => value !== undefined ? `${value.toFixed(1)} / 5` : 'N/A'
  },
  'speed-demons': {
    id: 'speed-demons',
    name: 'Speed Demons',
    description: 'Users with the fastest average task completion time',
    icon: <FaStopwatch />,
    statKey: 'avgCompletionTime',
    statLabel: 'Avg. Completion Time',
    higherIsBetter: false,
    format: (minutes?: number) => {
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
    }
  },
  'consistency': {
    id: 'consistency',
    name: 'Most Consistent',
    description: 'Users who consistently complete tasks on time',
    icon: <FaCalendarAlt />,
    statKey: 'tasksOverdue',
    statLabel: 'Tasks Overdue',
    higherIsBetter: false,
    format: (value: number) => `${value}`
  },
};

const LeaderboardDetailPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [leaderboardId, setLeaderboardId] = useState<string>('');
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; outOf: number } | null>(null);

  useEffect(() => {
    if (params && params.leaderboardId) {
      const id = params.leaderboardId as string;
      setLeaderboardId(id);
      
      if (user) {
        fetchLeaderboardData(id);
      }
    }
  }, [params, user]);

  const fetchLeaderboardData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get leaderboard data from the API
      const leaderboardData = await getLeaderboardDetail(id);
      
      // Sort the data based on the leaderboard type
      const leaderboardType = LEADERBOARD_TYPES[id as keyof typeof LEADERBOARD_TYPES];
      
      if (!leaderboardType) {
        throw new Error('Invalid leaderboard type');
      }
      
      let sortedData = [...leaderboardData];
      const statKey = leaderboardType.statKey as keyof LeaderboardEntry;
      
      sortedData.sort((a, b) => {
        const aValue = a[statKey] as number | undefined;
        const bValue = b[statKey] as number | undefined;
        
        // Handle undefined values (put them at the end)
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Sort based on whether higher is better
        return leaderboardType.higherIsBetter
          ? bValue - aValue // Higher values first
          : aValue - bValue; // Lower values first
      });
      
      setEntries(sortedData);
      
      // Calculate user's rank if they're on the leaderboard
      if (user) {
        const userIndex = sortedData.findIndex(entry => entry.id === user.id);
        if (userIndex !== -1) {
          setUserRank({
            rank: userIndex + 1,
            outOf: sortedData.length
          });
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const leaderboardType = LEADERBOARD_TYPES[leaderboardId as keyof typeof LEADERBOARD_TYPES];

  // If the leaderboard type is not valid, show an error
  if (leaderboardId && !LEADERBOARD_TYPES[leaderboardId as keyof typeof LEADERBOARD_TYPES]) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/leaderboard" className={styles.backButton}>
            <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Leaderboards
          </Link>
          <h1 className={styles.title}>Invalid Leaderboard</h1>
        </div>
        <div className={styles.error}>
          <p>The requested leaderboard does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/leaderboard" className={styles.backButton}>
              <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Leaderboards
            </Link>
            
            <div className={styles.titleWrapper}>
              <div className={styles.icon}>
                {leaderboardType?.icon || <FaTrophy />}
              </div>
              <div>
                <h1 className={styles.title}>{leaderboardType?.name || 'Leaderboard'}</h1>
                <p className={styles.subtitle}>{leaderboardType?.description || 'View top performing users'}</p>
              </div>
            </div>
            
            {userRank && (
              <div className={styles.userRankCard}>
                <div className={styles.userRankLabel}>Your Rank</div>
                <div className={styles.userRankValue}>
                  {userRank.rank}/{userRank.outOf}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className={styles.error}>
              {error}
              <Button 
                size="sm" 
                variant="primary" 
                onClick={() => fetchLeaderboardData(leaderboardId)}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Leaderboard table */}
          <div className={styles.card}>
            {isLoading ? (
              <div className={styles.loading}>Loading leaderboard data...</div>
            ) : entries.length > 0 ? (
              <div className={styles.leaderboardTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankColumn}>Rank</div>
                  <div className={styles.userColumn}>User</div>
                  <div className={styles.statsColumn}>{leaderboardType?.statLabel}</div>
                  <div className={styles.additionalStats}>
                    <div>Tasks Completed</div>
                    <div>Completion Rate</div>
                  </div>
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
                      <div className={styles.mainStatValue}>
                        {leaderboardType?.format(entry[leaderboardType.statKey as keyof LeaderboardEntry] as number)}
                      </div>
                    </div>
                    <div className={styles.additionalStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Completed:</span>
                        <span className={styles.statValue}>{entry.tasksCompleted}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Success Rate:</span>
                        <span className={styles.statValue}>{Math.round((1 - entry.tasksOverdue / (entry.tasksCompleted + entry.tasksOverdue)) * 100)}%</span>
                      </div>
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

export default LeaderboardDetailPage; 