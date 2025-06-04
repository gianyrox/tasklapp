'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import TaskList from '../../components/task/TaskList';
import { 
  TaskStatus, 
  FriendshipStatus, 
  SubmissionType, 
  TaskPriority 
} from '../../types';
import type { 
  Friendship, 
  Task, 
  LeaderboardEntry, 
  User
} from '../../types';
import styles from './Dashboard.module.css';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { addLog } from '../../lib/logging';
import { LogCategory } from '../../../confy/types';
import { 
  supabase,
  getFriendships, 
  getTasksFromFriends, 
  getSelfAssignedTasks,
  getTasksAssignedToOthers,
  getTasksByFriend, 
  getLeaderboard,
  updateTaskStatus, 
  updateTaskSubmissionType,
  updateTaskSubmissionContent
} from '../../lib/api/supabase';
import Board from '../../components/ui/Board';
import Button, { ButtonSize } from '../../components/ui/Button';
import CreateTaskModal from '../../components/task/CreateTaskModal';
import { useRouter } from 'next/navigation';

// Helper function to transform task data from Supabase format to our app format
const transformTaskFromDb = (task: any): Task => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: new Date(task.created_at),
    dueDate: new Date(task.due_date),
    assignerId: task.assigner_id,
    assigneeId: task.assignee_id,
    status: task.status as TaskStatus,
    priority: task.priority,
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    estimatedTimeMinutes: task.estimated_time_minutes,
    actualTimeMinutes: task.actual_time_minutes,
    submissionDate: task.submission_date ? new Date(task.submission_date) : undefined,
    qualityRating: task.quality_rating,
    feedback: task.feedback,
    attachments: task.attachments ? task.attachments.map((attachment: any) => ({
      id: attachment.id,
      taskId: attachment.task_id,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      fileName: attachment.file_name,
      createdAt: new Date(attachment.created_at)
    })) : [],
    assigner: task.assigner ? {
      id: task.assigner.id,
      name: task.assigner.name,
      email: task.assigner.email,
      avatarUrl: task.assigner.avatar_url,
      createdAt: new Date(task.assigner.created_at || Date.now()),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email,
      avatarUrl: task.assignee.avatar_url,
      createdAt: new Date(task.assignee.created_at || Date.now()),
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined
  };
};

// Helper functions
const filterTasksFromFriends = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId !== userId);
};

const filterSelfAssignedTasks = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId === userId);
};

const DashboardPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendTasks, setFriendTasks] = useState<{[friendId: string]: Task[]}>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string>('');
  const [tasksFromFriends, setTasksFromFriends] = useState<Task[]>([]);
  const [tasksAssignedToOthers, setTasksAssignedToOthers] = useState<Task[]>([]);
  const [selfAssignedTasks, setSelfAssignedTasks] = useState<Task[]>([]);
  const dataFetchedRef = useRef(false);
  const authStateRef = useRef<{ user: User | null; authLoading: boolean }>({ user: null, authLoading: true });
  const initialAuthCheckRef = useRef(false);

  // Update auth state ref when it changes
  useEffect(() => {
    console.log('Auth state changed:', { user, authLoading });
    authStateRef.current = { user, authLoading };
  }, [user, authLoading]);

  // Fetch data when component mounts or user changes
  useEffect(() => {
    const logAuthState = async () => {
    console.log('Dashboard auth state:', { user, authLoading });
    
      if (!authLoading) {
        if (!user) {
          console.log('No user found, redirecting to login');
          await addLog({
            category: LogCategory.AUTH,
            action: 'dashboard_no_user',
            details: { 
              url: window.location.pathname,
              hasCookies: document.cookie.includes('supabase-auth'),
              timestamp: new Date().toISOString()
            }
          });
          
          router.push('/login?redirect=/dashboard');
          return;
        }
        
        // Only fetch data if we have a user and haven't fetched yet
        if (user?.id && !dataFetchedRef.current) {
      console.log('Starting dashboard data fetch for user:', user.id);
      dataFetchedRef.current = true;
          await fetchDashboardData();
        }
    }
    };
    
    logAuthState();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Dashboard detected auth event:', event);
      
      if (event === 'INITIAL_SESSION') {
        if (session?.user?.id && !dataFetchedRef.current) {
          console.log('Initial session detected, fetching data');
          dataFetchedRef.current = true;
          await fetchDashboardData();
        }
        return;
      }
      
      // Only handle events that change auth state
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
        await addLog({
          userId: session?.user?.id,
          category: LogCategory.AUTH,
          action: 'dashboard_auth_event',
          details: { 
            event,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
        
        if (event === 'SIGNED_IN' && session?.user?.id) {
        console.log('Auth event triggered dashboard refresh');
        dataFetchedRef.current = true;
          await fetchDashboardData();
        } else if (event === 'SIGNED_OUT') {
          // Clear dashboard state
          setMyTasks([]);
          setFriends([]);
          setFriendTasks({});
          setLeaderboard([]);
          setTasksFromFriends([]);
          setTasksAssignedToOthers([]);
          setSelfAssignedTasks([]);
          dataFetchedRef.current = false;
          initialAuthCheckRef.current = false;
          
          router.push('/login?redirect=/dashboard');
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
      dataFetchedRef.current = false;
    };
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data...');
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
      console.log('No user found, aborting dashboard data fetch');
      setIsLoading(false);
      return;
    }

      console.log('Fetching data for user:', user.id);
      
      // Fetch tasks assigned by friends
      const allTasksFromFriends = await getTasksFromFriends();
      
      // Fetch self-assigned tasks
      const allSelfTasks = await getSelfAssignedTasks(user.id);
      
      // Fetch tasks the user assigned to others
      const assignedToOthers = await getTasksAssignedToOthers(user.id);

      // Combine tasks assigned to current user
      const allMyTasks = [...allTasksFromFriends, ...allSelfTasks];
      setMyTasks(allMyTasks);
      
      // Filter tasks into different categories
      const fromFriends = filterTasksFromFriends(allMyTasks, user.id);
      const selfAssigned = filterSelfAssignedTasks(allMyTasks, user.id);
      
      setTasksFromFriends(fromFriends);
      setTasksAssignedToOthers(assignedToOthers);
      setSelfAssignedTasks(selfAssigned);
      
      // Fetch accepted friendships
      const friendships = await getFriendships(FriendshipStatus.ACCEPTED);
      setFriends(friendships);
      
      // Fetch tasks for each friend
      const tasksByFriend: {[friendId: string]: Task[]} = {};
      for (const friendship of friendships) {
        const friendId = friendship.userId === user.id ? friendship.friendId : friendship.userId;
        const friendTasks = await getTasksByFriend(friendId);
        tasksByFriend[friendId] = friendTasks;
      }
      setFriendTasks(tasksByFriend);
      
      // Fetch leaderboard data
      const leaderboardData = await getLeaderboard();
      setLeaderboard(leaderboardData.slice(0, 3));
      
      console.log('Dashboard data fetch complete');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setIsLoading(true);
    try {
      await updateTaskStatus(taskId, newStatus);
      // Re-fetch tasks
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionTypeChange = async (taskId: string, newType: SubmissionType) => {
    setIsLoading(true);
    try {
      await updateTaskSubmissionType(taskId, newType);
      // Re-fetch tasks
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating task submission type:', err);
      setError('Failed to update task submission type. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionContentChange = async (taskId: string, content: string) => {
    setIsLoading(true);
    try {
      await updateTaskSubmissionContent(taskId, content);
      // Re-fetch tasks
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating task submission content:', err);
      setError('Failed to update task submission content. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    // Always set this to the current user when adding your own task
    setSelectedAssigneeId(user?.id || '');
    setSelectedAssigneeName('Yourself');
    setShowCreateTaskModal(true);
  };
  
  const handleAddTaskToFriend = (friendId: string, friendName: string) => {
    setSelectedAssigneeId(friendId);
    setSelectedAssigneeName(friendName);
    setShowCreateTaskModal(true);
  };

  const handleTaskCreated = async () => {
    // Refresh task list based on who the task was assigned to
    if (selectedAssigneeId === user?.id) {
      // It was a self-assigned task, need to refresh my tasks
      const tasksFromFriends = await getTasksFromFriends();
      const selfTasks = await getSelfAssignedTasks(user?.id || '');
      const allMyTasks = [...tasksFromFriends, ...selfTasks];
      setMyTasks(allMyTasks);
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

  // Add Find Friends handler
  const handleFindFriends = () => {
    router.push('/friend');
  };

  // Combined loading state
  const isPageLoading = isLoading || authLoading;

  // Display loading state
  if (isPageLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
          </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <h1>Dashboard</h1>
            <div className={styles.actions}>
              <Button onClick={handleAddTask}>Add Task</Button>
              <Button onClick={handleFindFriends}>Find Friends</Button>
              </div>
          </div>

          <div className={styles.content}>
            <div className={styles.mainContent}>
              <Board title="My Tasks">
                        <TaskList 
                  tasks={myTasks}
                          onStatusChange={handleStatusChange} 
                          onSubmissionTypeChange={handleSubmissionTypeChange}
                          onSubmissionContentChange={handleSubmissionContentChange}
                />
              </Board>
            </div>

            <div className={styles.sidebar}>
              <Board title="Leaderboard" className={styles.leaderboard}>
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className={styles.leaderboardEntry}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{entry.name}</span>
                    <span className={styles.score}>{entry.tasksCompleted} tasks</span>
                            </div>
                          ))}
              </Board>

              <Board title="Friends" className={styles.friends}>
                {friends.map(friendship => {
                  const friend = friendship.friend;
                  if (!friend) return null;
                  
                  return (
                    <div key={friend.id} className={styles.friendEntry}>
                      <div className={styles.friendInfo}>
                        <span className={styles.name}>{friend.name}</span>
                        <Button 
                          size="xs"
                          onClick={() => handleAddTaskToFriend(friend.id, friend.name)}
                        >
                            Assign Task
                        </Button>
                          </div>
                      {friendTasks[friend.id] && (
                        <div className={styles.friendTasks}>
                          <TaskList 
                            tasks={friendTasks[friend.id]}
                            onStatusChange={handleStatusChange}
                            onSubmissionTypeChange={handleSubmissionTypeChange}
                            onSubmissionContentChange={handleSubmissionContentChange}
                          />
                        </div>
                      )}
                      </div>
                  );
                })}
              </Board>
              </div>
          </div>
          </div>

          {showCreateTaskModal && (
            <CreateTaskModal
              assigneeId={selectedAssigneeId}
              assigneeName={selectedAssigneeName}
              onClose={() => setShowCreateTaskModal(false)}
              onCreated={handleTaskCreated}
            />
          )}
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 