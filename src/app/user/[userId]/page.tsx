'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import { User, Task } from '../../../types';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Board from '../../../components/ui/Board';
import TaskList from '../../../components/task/TaskList';
import Button from '../../../components/ui/Button';
import BackButton from '../../../components/ui/BackButton';
import { getUserById, getTasksByUser } from '../../../lib/api/supabase';
import styles from './UserProfile.module.css';

const UserPage: React.FC = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user && userId) {
      fetchUserData();
    }
  }, [user, userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const profile = await getUserById(userId as string);
      setUserProfile(profile);
      
      // Fetch user tasks
      const tasks = await getTasksByUser(userId as string);
      setUserTasks(tasks);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.userProfile}>
          <BackButton route="/dashboard" />
        
          <div className={styles.userHeader}>
            <h1>{userProfile?.name || 'User'}'s Profile</h1>
            <p className={styles.userEmail}>{userProfile?.email || ''}</p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchUserData}>
                Try Again
              </Button>
            </div>
          )}

          {/* User Tasks */}
          <Board 
            title={`${userProfile?.name || 'User'}'s Tasks`}
            isLoading={isLoading}
            className={styles.tasksBoard}
            actionButton={
              <Button size="sm" variant="outline">Assign Task</Button>
            }
            emptyState={
              <div className={styles.emptyState}>
                <p>This user doesn't have any tasks yet</p>
              </div>
            }
          >
            <TaskList tasks={userTasks} showDetails={true} />
          </Board>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default UserPage; 