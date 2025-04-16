'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { TaskStatus, Friendship, FriendshipStatus, Task } from '../../types';
import styles from './Dashboard.module.css';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import CreateTaskModal from '../../components/task/CreateTaskModal';
import { 
  getFriendships, 
  getTasksFromFriends, 
  getTasksByFriend, 
  updateTaskStatus, 
  createTask,
  supabase
} from '../../lib/api/supabase';
import { getLeaderboard } from '../../lib/api/supabase';
import { useRouter } from 'next/navigation';

// Import new componentized sections
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatsSection from '../../components/dashboard/StatsSection';
import TasksSection from '../../components/dashboard/TasksSection';
import LeaderboardSection from '../../components/dashboard/LeaderboardSection';
import FriendsSection from '../../components/dashboard/FriendsSection';

// Helper functions since we can't import from taskHelpers
// Function to filter tasks from friends
const filterTasksFromFriends = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId !== userId);
};

// Function to filter tasks assigned to others
const filterTasksAssignedToOthers = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assignerId === userId && task.assigneeId !== userId);
};

// Function to filter self-assigned tasks
const filterSelfAssignedTasks = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assigneeId === userId && task.assignerId === userId);
};

// Function to get self-assigned tasks
const getSelfAssignedTasks = async (userId: string): Promise<Task[]> => {
  // Use the Supabase client to get tasks where user is both assignee and assigner
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assignee_id', userId)
    .eq('assigner_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching self-assigned tasks:', error);
    return [];
  }
  
  return data;
};

// Function to get all tasks assigned by the user to others
const getTasksAssignedToOthers = async (userId: string): Promise<Task[]> => {
  // Use the Supabase client to get tasks where user is the assigner but not the assignee
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assigner_id', userId)
    .neq('assignee_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching tasks assigned to others:', error);
    return [];
  }
  
  return data;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendTasks, setFriendTasks] = useState<{[friendId: string]: any[]}>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string>('');
  const [tasksFromFriends, setTasksFromFriends] = useState<any[]>([]);
  const [tasksAssignedToOthers, setTasksAssignedToOthers] = useState<any[]>([]);
  const [selfAssignedTasks, setSelfAssignedTasks] = useState<any[]>([]);

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
      const allTasksFromFriends = await getTasksFromFriends();
      
      // Fetch self-assigned tasks
      const allSelfTasks = await getSelfAssignedTasks(user?.id || '');
      
      // Fetch tasks the user assigned to others
      const assignedToOthers = await getTasksAssignedToOthers(user?.id || '');

      // Combine tasks assigned to current user
      const allMyTasks = [...allTasksFromFriends, ...allSelfTasks];
      setMyTasks(allMyTasks);
      
      // Filter tasks into different categories
      const fromFriends = filterTasksFromFriends(allMyTasks, user?.id || '');
      const selfAssigned = filterSelfAssignedTasks(allMyTasks, user?.id || '');
      
      setTasksFromFriends(fromFriends);
      setTasksAssignedToOthers(assignedToOthers);
      setSelfAssignedTasks(selfAssigned);
      
      // Fetch accepted friendships
      const friendships = await getFriendships(FriendshipStatus.ACCEPTED);
      setFriends(friendships);
      
      // Fetch tasks for each friend
      const tasksByFriend: {[friendId: string]: any[]} = {};
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
    // Refresh task list
    setShowCreateTaskModal(false);
    fetchDashboardData();
  };

  const handleFindFriends = () => {
    router.push('/friend');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.dashboard}>
          {/* Error display */}
          {error && <div className={styles.error}>{error}</div>}
          
          {/* Dashboard Header */}
          <DashboardHeader user={user} isLoading={isLoading} />
          
          {/* Stats Overview */}
          <StatsSection tasks={myTasks} isLoading={isLoading} />
          
          {/* Task Columns Layout */}
          <div className={styles.tasksColumnsContainer}>
            {/* Column 1: Tasks from Friends and Self-Assigned Tasks */}
            <TasksSection
              title="All My Tasks"
              tasks={[...tasksFromFriends, ...selfAssignedTasks]}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onAddTask={handleAddTask}
              emptyMessage="You don't have any tasks yet"
              columnLayout={true}
            />
            
            {/* Column 2: Tasks Assigned to Others */}
            <TasksSection
              title="Tasks I've Assigned"
              tasks={tasksAssignedToOthers}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              emptyMessage="You haven't assigned tasks to others"
              columnLayout={true}
            />
          </div>
          
          {/* Friends section */}
          <FriendsSection
            friends={friends}
            friendTasks={friendTasks}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
            onAddTaskToFriend={handleAddTaskToFriend}
            onFindFriends={handleFindFriends}
          />
          
          {/* Leaderboard section */}
          <LeaderboardSection
            leaderboard={leaderboard}
            isLoading={isLoading}
            currentUserId={user?.id}
          />
          
          {/* Task creation modal */}
          {showCreateTaskModal && (
            <CreateTaskModal
              onClose={() => setShowCreateTaskModal(false)}
              onCreated={handleTaskCreated}
              assigneeId={selectedAssigneeId}
              assigneeName={selectedAssigneeName}
              assignerId={user?.id || ''}
              assignerName={user?.name || ''}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage; 