'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  User, 
  Task, 
  Friendship, 
  TaskAttachment,
  LeaderboardEntry,
  FriendshipStatus,
  TaskStatus
} from '../types';
import { 
  getAllUsers, 
  getUserTasks, 
  getFriendships, 
  getLeaderboard,
  createTask,
  updateTaskStatus,
  sendFriendRequest,
  respondToFriendRequest,
  addTaskAttachment,
  getTasksFromFriends,
  getTasksByFriend,
  getUserAssignedTasks
} from '../lib/api/supabase';
import { useAuth } from './AuthContext';

// Define the types of data that will be managed by this context
interface DatabaseContextType {
  // Data states
  users: User[];
  tasks: Task[];
  friendships: Friendship[];
  friendRequests: Friendship[];
  leaderboard: LeaderboardEntry[];
  
  // Loading states
  isLoadingUsers: boolean;
  isLoadingTasks: boolean;
  isLoadingFriendships: boolean;
  isLoadingLeaderboard: boolean;
  
  // Error states
  usersError: string | null;
  tasksError: string | null;
  friendshipsError: string | null;
  leaderboardError: string | null;
  
  // Data loading functions
  loadUsers: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadFriendships: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  
  // Data manipulation functions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task | null>;
  updateTask: (
    taskId: string, 
    status: TaskStatus, 
    metadata?: {
      completedAt?: Date;
      actualTimeMinutes?: number;
      qualityRating?: number;
      timelinessRating?: number;
      effortRating?: number;
      accuracyRating?: number;
      feedback?: string;
    }
  ) => Promise<Task | null>;
  addFriend: (friendId: string) => Promise<boolean>;
  respondToFriend: (friendshipId: string, accept: boolean) => Promise<boolean>;
  uploadTaskAttachment: (
    taskId: string,
    fileUrl: string,
    fileType?: string,
    fileName?: string
  ) => Promise<TaskAttachment | null>;
  loadFriendTasks: (friendId: string) => Promise<Task[]>;
}

// Create the context
const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Create the provider component
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingFriendships, setIsLoadingFriendships] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  
  // Error states
  const [usersError, setUsersError] = useState<string | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [friendshipsError, setFriendshipsError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  
  // Function to load all users
  const loadUsers = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingUsers(true);
    setUsersError(null);
    
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsersError('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user]);
  
  // Function to load all tasks for the current user
  const loadTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingTasks(true);
    setTasksError(null);
    
    try {
      const tasksFromMe = await getUserAssignedTasks(user.id);
      console.log('Tasks assigned by me:', tasksFromMe.length);
      
      const tasksForMe = await getUserTasks(user.id);
      console.log('Tasks assigned to me:', tasksForMe.length);
      
      const friendTasks = await getTasksFromFriends();
      console.log('Tasks from friends:', friendTasks.length);
      
      // Combine all tasks and remove duplicates
      const allTasks = [...tasksFromMe, ...tasksForMe, ...friendTasks];
      const uniqueTasks = allTasks.filter((task, index, self) => 
        index === self.findIndex(t => t.id === task.id)
      );
      
      console.log('Total unique tasks:', uniqueTasks.length);
      console.log('Task statuses:', uniqueTasks.map(t => t.status));
      
      setTasks(uniqueTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasksError('Failed to load tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user]);
  
  // Function to load specific friend's tasks
  const loadFriendTasks = useCallback(async (friendId: string): Promise<Task[]> => {
    if (!user) return [];
    
    try {
      return await getTasksByFriend(friendId);
    } catch (error) {
      console.error(`Error loading tasks for friend ${friendId}:`, error);
      return [];
    }
  }, [user]);
  
  // Function to load all friendships
  const loadFriendships = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingFriendships(true);
    setFriendshipsError(null);
    
    try {
      const allFriendships = await getFriendships();
      console.log('Friendships loaded:', allFriendships);
      
      // Separate accepted friendships and pending requests
      const accepted = allFriendships.filter(f => f.status === FriendshipStatus.ACCEPTED);
      const pending = allFriendships.filter(f => f.status === FriendshipStatus.PENDING);
      
      console.log('Accepted friendships:', accepted.length);
      console.log('Pending friendships:', pending.length);
      
      setFriendships(accepted);
      setFriendRequests(pending);
    } catch (error) {
      console.error('Error loading friendships:', error);
      setFriendshipsError('Failed to load friendships');
    } finally {
      setIsLoadingFriendships(false);
    }
  }, [user]);
  
  // Function to load leaderboard
  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingLeaderboard(true);
    setLeaderboardError(null);
    
    try {
      const leaderboardData = await getLeaderboard();
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboardError('Failed to load leaderboard');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [user]);
  
  // Function to add a new task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return null;
    
    try {
      const newTask = await createTask(taskData);
      if (newTask) {
        setTasks(prevTasks => [...prevTasks, newTask]);
      }
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  }, [user]);
  
  // Function to update a task's status
  const updateTask = useCallback(async (
    taskId: string, 
    status: TaskStatus, 
    metadata?: {
      completedAt?: Date;
      actualTimeMinutes?: number;
      qualityRating?: number;
      timelinessRating?: number;
      effortRating?: number;
      accuracyRating?: number;
      feedback?: string;
    }
  ) => {
    if (!user) return null;
    
    try {
      const updatedTask = await updateTaskStatus(taskId, status, metadata);
      
      if (updatedTask) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        );
      }
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }, [user]);
  
  // Function to send a friend request
  const addFriend = useCallback(async (friendId: string) => {
    if (!user) return false;
    
    try {
      const success = await sendFriendRequest(friendId);
      
      if (success) {
        // Reload friendships to get the updated list
        await loadFriendships();
      }
      
      return success;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  }, [user, loadFriendships]);
  
  // Function to respond to a friend request
  const respondToFriend = useCallback(async (friendshipId: string, accept: boolean) => {
    if (!user) return false;
    
    try {
      const success = await respondToFriendRequest(friendshipId, accept);
      
      if (success) {
        // Reload friendships to get the updated list
        await loadFriendships();
      }
      
      return success;
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return false;
    }
  }, [user, loadFriendships]);
  
  // Function to add an attachment to a task
  const uploadTaskAttachment = useCallback(async (
    taskId: string,
    fileUrl: string,
    fileType?: string,
    fileName?: string
  ) => {
    if (!user) return null;
    
    try {
      const attachment = await addTaskAttachment(taskId, fileUrl, fileType, fileName);
      
      if (attachment) {
        // Update the task in our state with the new attachment
        setTasks(prevTasks => 
          prevTasks.map(task => {
            if (task.id === taskId) {
              const attachments = task.attachments || [];
              return {
                ...task,
                attachments: [...attachments, attachment]
              };
            }
            return task;
          })
        );
      }
      
      return attachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  }, [user]);
  
  return (
    <DatabaseContext.Provider value={{
      // Data states
      users,
      tasks,
      friendships,
      friendRequests,
      leaderboard,
      
      // Loading states
      isLoadingUsers,
      isLoadingTasks,
      isLoadingFriendships,
      isLoadingLeaderboard,
      
      // Error states
      usersError,
      tasksError,
      friendshipsError,
      leaderboardError,
      
      // Data loading functions
      loadUsers,
      loadTasks,
      loadFriendships,
      loadLeaderboard,
      
      // Data manipulation functions
      addTask,
      updateTask,
      addFriend,
      respondToFriend,
      uploadTaskAttachment,
      loadFriendTasks
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

// Custom hook to use the database context
export function useDatabase() {
  const context = useContext(DatabaseContext);
  
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  
  return context;
} 