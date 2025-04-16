'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import { LeaderboardEntry } from '../../../types';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import { getLeaderboardDetail } from '../../../lib/api/supabase';
import styles from './LeaderboardDetail.module.css';

const LeaderboardDetailPage: React.FC = () => {
  const { leaderboardId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeaderboardData();
    }
  }, [user, leaderboardId]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLeaderboardDetail(leaderboardId as string);
      setLeaderboardData(data);
      
      // Find the current user's rank
      const userRankEntry = data.findIndex(entry => entry.id === user?.id);
      if (userRankEntry !== -1) {
        setCurrentUserRank(userRankEntry + 1);
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading leaderboard...</p>
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
              <Button variant="primary" onClick={fetchLeaderboardData}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const renderLeaderboardType = () => {
    switch (leaderboardId) {
      case 'global':
        return 'Global Leaderboard';
      case 'friends':
        return 'Friends Leaderboard';
      case 'weekly':
        return 'Weekly Leaderboard';
      case 'monthly':
        return 'Monthly Leaderboard';
      default:
        return 'Leaderboard';
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{renderLeaderboardType()}</h1>
            <Button 
              variant="outline"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>

          {currentUserRank && (
            <div className={styles.userRankContainer}>
              <div className={styles.userRank}>
                <div className={styles.rankLabel}>Your Rank</div>
                <div className={styles.rankValue}>{currentUserRank}</div>
              </div>
            </div>
          )}

          <div className={styles.leaderboardTable}>
            <div className={styles.tableHeader}>
              <div className={styles.rankColumn}>Rank</div>
              <div className={styles.userColumn}>User</div>
              <div className={styles.tasksCompletedColumn}>Tasks Completed</div>
              <div className={styles.avgRatingColumn}>Avg. Rating</div>
              <div className={styles.tasksOverdueColumn}>Tasks Overdue</div>
            </div>
            
            <div className={styles.tableBody}>
              {leaderboardData.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`${styles.tableRow} ${entry.id === user?.id ? styles.currentUserRow : ''}`}
                >
                  <div className={styles.rankColumn}>{index + 1}</div>
                  <div className={styles.userColumn}>
                    <div className={styles.userInfo}>
                      {entry.avatarUrl && (
                        <img 
                          src={entry.avatarUrl} 
                          alt={entry.name} 
                          className={styles.avatar} 
                        />
                      )}
                      <span className={styles.userName}>
                        {entry.name}
                        {entry.id === user?.id && <span className={styles.currentUser}>(You)</span>}
                      </span>
                    </div>
                  </div>
                  <div className={styles.tasksCompletedColumn}>{entry.tasksCompleted}</div>
                  <div className={styles.avgRatingColumn}>
                    {entry.avgQualityRating ? entry.avgQualityRating.toFixed(1) : '-'}
                  </div>
                  <div className={styles.tasksOverdueColumn}>{entry.tasksOverdue}</div>
                </div>
              ))}
              
              {leaderboardData.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No data available for this leaderboard.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default LeaderboardDetailPage; 