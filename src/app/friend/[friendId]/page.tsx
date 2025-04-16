'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import { User, Task, FriendshipStatus } from '../../../types';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Board from '../../../components/ui/Board';
import TaskList from '../../../components/task/TaskList';
import Button from '../../../components/ui/Button';
import BackButton from '../../../components/ui/BackButton';
import CreateTaskModal from '../../../components/task/CreateTaskModal';
import { getFriendById, getTasksByFriend } from '../../../lib/api/supabase';
import styles from './FriendProfile.module.css';

const FriendProfilePage: React.FC = () => {
  const { friendId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friend, setFriend] = useState<User | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus | null>(null);
  const [friendTasks, setFriendTasks] = useState<Task[]>([]);
  const [isShowingTaskModal, setIsShowingTaskModal] = useState(false);

  useEffect(() => {
    if (user && friendId) {
      fetchFriendData();
    }
  }, [user, friendId]);

  const fetchFriendData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch friend profile and status
      const { friendProfile, status } = await getFriendById(friendId as string);
      
      if (!friendProfile) {
        setError('Friend not found');
        setIsLoading(false);
        return;
      }
      
      setFriend(friendProfile);
      setFriendStatus(status);
      
      if (status === FriendshipStatus.ACCEPTED) {
        // Only fetch tasks if they're friends
        const tasks = await getTasksByFriend(friendId as string);
        setFriendTasks(tasks);
      }
    } catch (err) {
      console.error('Error fetching friend data:', err);
      setError('Failed to load friend data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCreated = async () => {
    if (friendStatus === FriendshipStatus.ACCEPTED && friendId) {
      try {
        const tasks = await getTasksByFriend(friendId as string);
        setFriendTasks(tasks);
      } catch (err) {
        console.error('Error refreshing tasks:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading friend profile...</p>
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
              <Button variant="primary" onClick={fetchFriendData}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!friend) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.container}>
            <div className={styles.errorMessage}>
              <p>Friend not found</p>
              <BackButton route="/friend" />
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <BackButton route="/friend" />
        
          <div className={styles.header}>
            <div className={styles.profileInfo}>
              {friend.avatarUrl && (
                <img 
                  src={friend.avatarUrl} 
                  alt={friend.name} 
                  className={styles.avatar} 
                />
              )}
              <div className={styles.nameSection}>
                <h1 className={styles.name}>{friend.name}</h1>
                <p className={styles.email}>{friend.email}</p>
                {friendStatus && (
                  <div className={`${styles.friendStatus} ${styles[friendStatus.toLowerCase()]}`}>
                    {friendStatus}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.actions}>
              {friendStatus === FriendshipStatus.ACCEPTED && (
                <Button 
                  variant="primary"
                  onClick={() => setIsShowingTaskModal(true)}
                >
                  Assign Task
                </Button>
              )}
            </div>
          </div>

          {friendStatus === FriendshipStatus.ACCEPTED ? (
            <div className={styles.content}>
              <Board 
                title={`Tasks Assigned to ${friend.name}`}
                isLoading={isLoading}
                className={styles.tasksBoard}
                actionButton={
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsShowingTaskModal(true)}
                  >
                    Assign New Task
                  </Button>
                }
                emptyState={
                  <div className={styles.emptyState}>
                    <p>You haven't assigned any tasks to {friend.name} yet</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsShowingTaskModal(true)}
                    >
                      Assign Task
                    </Button>
                  </div>
                }
              >
                <TaskList tasks={friendTasks} showDetails={true} />
              </Board>
            </div>
          ) : (
            <div className={styles.notFriends}>
              <p>You need to be friends with {friend.name} to see their tasks and assign new ones.</p>
              {friendStatus === FriendshipStatus.PENDING && (
                <p>Friend request is pending.</p>
              )}
            </div>
          )}
        </div>

        {/* Task Creation Modal */}
        {isShowingTaskModal && friend && (
          <CreateTaskModal
            assigneeId={friend.id}
            assigneeName={friend.name}
            onClose={() => setIsShowingTaskModal(false)}
            onCreated={handleTaskCreated}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default FriendProfilePage; 