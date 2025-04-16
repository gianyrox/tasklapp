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
import { getUserById, getTasksByUser } from '../../../lib/api/supabase';

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
        <div className="user-profile">
          <div className="user-header">
            <h1>{userProfile?.name || 'User'}'s Profile</h1>
            <p className="user-email">{userProfile?.email || ''}</p>
          </div>

          {error && (
            <div className="error-message">
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
            className="tasks-board"
            actionButton={
              <Button size="sm" variant="outline">Assign Task</Button>
            }
            emptyState={
              <div className="empty-state">
                <p>This user doesn't have any tasks yet</p>
              </div>
            }
          >
            <TaskList tasks={userTasks} showDetails={true} />
          </Board>
        </div>
        <style jsx>{`
          .user-profile {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }
          
          .user-header {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          
          .user-header h1 {
            font-size: 2rem;
            margin: 0;
            color: #111827;
          }
          
          .user-email {
            font-size: 1rem;
            color: #4B5563;
            margin: 0;
          }
          
          .empty-state {
            text-align: center;
            padding: 2rem;
            color: #6B7280;
          }
          
          .tasks-board {
            margin-bottom: 2rem;
          }
          
          .error-message {
            background-color: #FEE2E2;
            border: 1px solid #FECACA;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
            color: #B91C1C;
          }
        `}</style>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default UserPage; 