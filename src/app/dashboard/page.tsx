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
import CreateTaskModal from '../../components/task/CreateTaskModal';
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
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string>('');

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

  const handleAddTask = async () => {
    setShowCreateTaskModal(true);
    
    // If it's for current user, use their ID
    if (!selectedAssigneeId) {
      setSelectedAssigneeId(user?.id || '');
      setSelectedAssigneeName('Yourself');
    }
  };
  
  const handleAddTaskToFriend = (friendId: string, friendName: string) => {
    setSelectedAssigneeId(friendId);
    setSelectedAssigneeName(friendName);
    setShowCreateTaskModal(true);
  };

  const handleTaskCreated = async () => {
    // Refresh task list based on who the task was assigned to
    if (selectedAssigneeId === user?.id) {
      // It was a self-assigned task, no need to fetch from friends
      // We could fetch here but this is optimizing for fewer API calls 
    } else {
      // It was assigned to a friend
      const updatedFriendTasks = await getTasksByFriend(selectedAssigneeId);
      setFriendTasks(prev => ({
        ...prev,
        [selectedAssigneeId]: updatedFriendTasks
      }));
    }
    
    // Refresh overall dashboard data
    fetchDashboardData();
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

  // Quick stats widgets
  const statsWidgets = [
    {
      title: "My Tasks",
      value: myTasks.length,
      description: "Total tasks assigned to you"
    },
    {
      title: "Completed",
      value: myTasks.filter(task => task.status === TaskStatus.COMPLETED).length,
      description: "Tasks you've completed"
    },
    {
      title: "Friends",
      value: friends.length,
      description: "Active connections"
    }
  ];

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

          {/* Stats Widgets */}
          <div className={styles.widgetsGrid}>
            {statsWidgets.map((stat, index) => (
              <div key={index} className={styles.statsCard}>
                <h3>{stat.title}</h3>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statDescription}>{stat.description}</div>
              </div>
            ))}
          </div>

          {/* My Tasks (Assigned by Friends) */}
          <Board 
            title="My Tasks (Assigned by Friends)" 
            isLoading={isLoading}
            className={styles.tasksBoard}
            actionButton={
              <button 
                onClick={() => handleAddTask()} 
                className={styles.addTaskButton}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Add Task
              </button>
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
                        <button 
                          onClick={() => handleAddTaskToFriend(friendId, friendName)} 
                          className={styles.addTaskButton}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          Assign Task
                        </button>
                      }
                      emptyState={
                        <div className={styles.emptyState}>
                          <p>You haven't assigned any tasks to {friendName} yet</p>
                          <button 
                            onClick={() => handleAddTaskToFriend(friendId, friendName)} 
                            className={styles.addTaskButton}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Assign Task
                          </button>
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
          
          {/* Task Creation Modal */}
          {showCreateTaskModal && (
            <CreateTaskModal
              assigneeId={selectedAssigneeId}
              assigneeName={selectedAssigneeName}
              onClose={() => setShowCreateTaskModal(false)}
              onCreated={handleTaskCreated}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 