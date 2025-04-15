'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import TaskList from '../../components/task/TaskList';
import { TaskStatus, Friendship, FriendshipStatus, Task, LeaderboardEntry } from '../../types';
import styles from './Dashboard.module.css';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Board from '../../components/ui/Board';
import Button from '../../components/ui/Button';
import { getFriendships, getTasksFromFriends, getTasksByFriend, updateTaskStatus, createTask } from '../../lib/api/supabase';
import { getLeaderboard } from '../../lib/api/supabase';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendTasks, setFriendTasks] = useState<{[friendId: string]: Task[]}>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tasks assigned by friends
      const tasks = await getTasksFromFriends();
      setMyTasks(tasks);
      
      // Fetch accepted friendships
      const friendships = await getFriendships(FriendshipStatus.ACCEPTED);
      setFriends(friendships);
      
      // Fetch tasks for each friend
      const tasksByFriend: {[friendId: string]: Task[]} = {};
      for (const friendship of friendships) {
        const friendId = friendship.userId === user?.id ? friendship.friendId : friendship.userId;
        const friendTasks = await getTasksByFriend(friendId);
        tasksByFriend[friendId] = friendTasks;
      }
      setFriendTasks(tasksByFriend);
      
      // Fetch leaderboard data
      const leaderboardData = await getLeaderboard();
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      // Refresh dashboard data after status change
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleAddTask = async (friendId: string, taskData: any) => {
    try {
      if (!user) return;
      
      const newTask = {
        title: taskData.title,
        description: taskData.description,
        dueDate: new Date(taskData.dueDate),
        assignerId: user.id,
        assigneeId: friendId,
        status: TaskStatus.PENDING,
        priority: taskData.priority,
        estimatedTimeMinutes: taskData.estimatedTimeMinutes
      };
      
      await createTask(newTask);
      // Refresh task list for this friend
      const updatedTasks = await getTasksByFriend(friendId);
      setFriendTasks(prev => ({
        ...prev,
        [friendId]: updatedTasks
      }));
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

  // Display error if data loading failed
  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.dashboard}>
            <div className={styles.header}>
              <h1>Dashboard</h1>
              <p className={styles.welcomeMessage}>
                Welcome back, <span className={styles.userName}>{user?.name}</span>
              </p>
            </div>
            <div className={styles.error}>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchDashboardData}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <h1>Dashboard</h1>
            <p className={styles.welcomeMessage}>
              Welcome back, <span className={styles.userName}>{user?.name}</span>
            </p>
          </div>

          {/* My Tasks (Assigned by Friends) */}
          <Board 
            title="My Tasks (Assigned by Friends)" 
            isLoading={isLoading}
            className={styles.tasksBoard}
            actionButton={
              <Button size="sm" variant="outline">View All</Button>
            }
            emptyState={
              <div className={styles.emptyState}>
                <p>You don't have any tasks assigned by friends yet</p>
                <Button size="sm" variant="outline" onClick={() => {/* Navigate to find friends */}}>
                  Find Friends
                </Button>
              </div>
            }
          >
            <TaskList tasks={myTasks} onStatusChange={handleStatusChange} showDetails={true} />
          </Board>

          {/* Friends' Task Lists */}
          <div className={styles.friendsSection}>
            <h2>Friends' Task Lists</h2>
            {friends.length === 0 && !isLoading ? (
              <div className={styles.emptyState}>
                <p>You haven't connected with any friends yet</p>
                <Button size="sm" variant="primary" onClick={() => {/* Navigate to find friends */}}>
                  Find Friends
                </Button>
              </div>
            ) : (
              <div className={styles.friendTasksGrid}>
                {friends.map(friendship => {
                  const friendId = friendship.userId === user?.id ? friendship.friendId : friendship.userId;
                  const friendName = friendship.friend?.name || 'Friend';
                  const tasks = friendTasks[friendId] || [];
                  
                  return (
                    <Board 
                      key={friendId}
                      title={`${friendName}'s Tasks`}
                      isLoading={isLoading}
                      actionButton={
                        <Button size="sm" variant="outline" onClick={() => {/* Open add task modal */}}>
                          Add Task
                        </Button>
                      }
                      emptyState={
                        <div className={styles.emptyState}>
                          <p>You haven't assigned any tasks to {friendName} yet</p>
                          <Button size="sm" variant="outline" onClick={() => {/* Open add task modal */}}>
                            Assign Task
                          </Button>
                        </div>
                      }
                    >
                      <TaskList tasks={tasks} showDetails={false} />
                    </Board>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <Board 
            title="Leaderboard" 
            isLoading={isLoading}
            className={styles.leaderboardBoard}
            actionButton={
              <Button size="sm" variant="outline">View Full Leaderboard</Button>
            }
            emptyState={
              <div className={styles.leaderboardEmptyState}>
                <p>Complete tasks to appear on the leaderboard!</p>
              </div>
            }
          >
            <div className={styles.leaderboardPreview}>
              {leaderboard.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className={`${styles.leaderboardEntry} ${entry.id === user?.id ? styles.currentUser : ''} ${entry.isFriend ? styles.friendUser : ''}`}>
                  <div className={styles.leaderboardRank}>{entry.rank}</div>
                  <div className={styles.leaderboardUser}>
                    {entry.avatarUrl && (
                      <img 
                        src={entry.avatarUrl} 
                        alt={entry.name} 
                        className={styles.leaderboardAvatar} 
                      />
                    )}
                    <span className={styles.leaderboardName}>{entry.name}</span>
                    {entry.id === user?.id && <span className={styles.leaderboardCurrentUser}>(You)</span>}
                  </div>
                  <div className={styles.leaderboardStats}>
                    <div className={styles.leaderboardStat}>
                      <span className={styles.leaderboardStatValue}>{entry.tasksCompleted}</span>
                      <span className={styles.leaderboardStatLabel}>Completed</span>
                    </div>
                    {entry.avgQualityRating && (
                      <div className={styles.leaderboardStat}>
                        <span className={styles.leaderboardStatValue}>{entry.avgQualityRating.toFixed(1)}</span>
                        <span className={styles.leaderboardStatLabel}>Rating</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Board>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 