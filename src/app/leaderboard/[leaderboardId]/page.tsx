'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { getLeaderboardDetail } from '../../../lib/api/supabase';
import { LeaderboardEntry } from '../../../types';
import { FaTrophy, FaArrowLeft } from 'react-icons/fa';
import { MdTaskAlt } from 'react-icons/md';
import Link from 'next/link';

import styles from './LeaderboardDetail.module.css';

// Define the single leaderboard type
const LEADERBOARD_TYPE = {
  id: 'tasks-completed',
  name: 'Tasks Completed',
  description: 'Users who have completed the most tasks',
  icon: <MdTaskAlt />,
  statKey: 'tasksCompleted',
  statLabel: 'Tasks Completed',
  higherIsBetter: true,
  format: (value: number) => `${value}`
};

const LeaderboardDetailPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; outOf: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeaderboardData();
    }
  }, [user]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get leaderboard data from the API
      const leaderboardData = await getLeaderboardDetail(LEADERBOARD_TYPE.id);
      
      // Sort the data based on the statKey
      let sortedData = [...leaderboardData];
      const statKey = LEADERBOARD_TYPE.statKey as keyof LeaderboardEntry;
      
      sortedData.sort((a, b) => {
        const aValue = a[statKey] as number | undefined;
        const bValue = b[statKey] as number | undefined;
        
        // Handle undefined values (put them at the end)
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Sort with higher values first
        return bValue - aValue;
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

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/dashboard" className={styles.backButton}>
              <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Dashboard
            </Link>
            
            <div className={styles.titleWrapper}>
              <div className={styles.icon}>
                {LEADERBOARD_TYPE.icon || <FaTrophy />}
              </div>
              <div>
                <h1 className={styles.title}>{LEADERBOARD_TYPE.name}</h1>
                <p className={styles.subtitle}>{LEADERBOARD_TYPE.description}</p>
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
                onClick={() => fetchLeaderboardData()}
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
                  <div className={styles.statsColumn}>{LEADERBOARD_TYPE.statLabel}</div>
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
                        {LEADERBOARD_TYPE.format(entry[LEADERBOARD_TYPE.statKey as keyof LeaderboardEntry] as number)}
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