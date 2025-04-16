import { createClient } from '@supabase/supabase-js';
import { Task, TaskStatus, TaskPriority, User, Friendship, FriendshipStatus, LeaderboardEntry, TaskAttachment } from '../../types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// User API functions
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  if (error || !data) {
    console.error('Error fetching current user:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at)
  };
};

export const updateUserProfile = async (data: {
  name?: string;
  avatarUrl?: string;
}): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Update auth.users metadata
    await supabase.auth.updateUser({
      data: {
        name: data.name,
        avatar_url: data.avatarUrl
      }
    });

    // Update public profile
    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        avatar_url: data.avatarUrl
      })
      .eq('id', session.user.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*, stats:user_stats(*)')
    .order('name');
    
  if (error || !data) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    createdAt: new Date(user.created_at),
    stats: {
      tasksCompleted: user.stats.tasks_completed,
      tasksAssigned: user.stats.tasks_assigned,
      averageCompletionTime: user.stats.average_completion_time,
      completionRate: user.stats.completion_rate,
      rank: user.stats.rank
    }
  }));
};

// Friend management functions
export const getFriendships = async (status?: FriendshipStatus): Promise<Friendship[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }
  
  console.log('Fetching friendships for user:', session.user.id, 'with status:', status || 'all');
  
  let query = supabase
    .from('friendships')
    .select(`
      *,
      friend:users!friendships_friend_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
    
  if (error || !data) {
    console.error('Error fetching friendships:', error);
    return [];
  }
  
  console.log('Friendships data from DB:', data.length, 'records');
  
  return data.map(friendship => {
    // Determine which user is the friend (not the current user)
    const isFriendRequester = friendship.user_id === session.user.id;
    const friendData = isFriendRequester 
      ? friendship.friend 
      : friendship.user;
    
    return {
      id: friendship.id,
      userId: friendship.user_id,
      friendId: friendship.friend_id,
      status: friendship.status as FriendshipStatus,
      createdAt: new Date(friendship.created_at),
      updatedAt: new Date(friendship.updated_at),
      friend: friendData ? {
        id: friendData.id,
        name: friendData.name,
        email: friendData.email,
        avatarUrl: friendData.avatar_url,
        createdAt: new Date(friendData.created_at)
      } : undefined
    };
  });
};

export const sendFriendRequest = async (friendId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: session.user.id,
        friend_id: friendId,
        status: FriendshipStatus.PENDING
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
};

export const respondToFriendRequest = async (
  friendshipId: string, 
  accept: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('friendships')
      .update({
        status: accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED,
        updated_at: new Date().toISOString()
      })
      .eq('id', friendshipId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return false;
  }
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session || !query || query.length < 3) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', session.user.id)
    .limit(10);
    
  if (error || !data) {
    console.error('Error searching users:', error);
    return [];
  }
  
  return data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    createdAt: new Date(user.created_at)
  }));
};

// Task API functions
export const getUserTasks = async (userId: string, filter?: 'assigned' | 'received'): Promise<Task[]> => {
  console.log('Fetching tasks for user:', userId, 'with filter:', filter || 'none');
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq(filter === 'assigned' ? 'assigner_id' : 'assignee_id', userId)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
  
  console.log('Tasks data from DB:', data.length, 'records', 'filter:', filter);
  
  return data.map(transformTaskFromDb);
};

export const getTasksByFriend = async (friendId: string): Promise<Task[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }
  
  // Get tasks that I assigned to this friend
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assigner_id', session.user.id)
    .eq('assignee_id', friendId)
    .order('created_at', { ascending: false });
    
  if (error || !data) {
    console.error('Error fetching tasks by friend:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
};

export const getTasksFromFriends = async (): Promise<Task[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }
  
  console.log('Fetching tasks from friends for user:', session.user.id);
  
  // First get accepted friendships
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('friend_id, user_id')
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
    .eq('status', FriendshipStatus.ACCEPTED);
    
  if (friendError || !friendships) {
    console.error('Error fetching friendships:', friendError);
    return [];
  }
  
  // Extract friend IDs
  const friendIds = friendships.map(f => 
    f.user_id === session.user.id ? f.friend_id : f.user_id
  );
  
  console.log('Found friend IDs:', friendIds.length, friendIds);
  
  if (friendIds.length === 0) {
    return [];
  }
  
  // Get tasks assigned by friends
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('assignee_id', session.user.id)
    .in('assigner_id', friendIds)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching tasks from friends:', error);
    return [];
  }
  
  console.log('Tasks from friends data from DB:', data.length, 'records');
  
  return data.map(transformTaskFromDb);
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description,
      due_date: task.dueDate.toISOString(),
      assigner_id: task.assignerId,
      assignee_id: task.assigneeId,
      status: task.status,
      priority: task.priority,
      completed_at: task.completedAt?.toISOString(),
      estimated_time_minutes: task.estimatedTimeMinutes,
      actual_time_minutes: task.actualTimeMinutes,
      submission_date: task.submissionDate?.toISOString(),
      quality_rating: task.qualityRating,
      feedback: task.feedback
    })
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error creating task:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
};

export const updateTaskStatus = async (
  taskId: string, 
  status: TaskStatus, 
  metadata?: {
    completedAt?: Date;
    actualTimeMinutes?: number;
    qualityRating?: number;
    feedback?: string;
  }
): Promise<Task | null> => {
  const updateData: any = { status };
  
  if (status === TaskStatus.COMPLETED) {
    updateData.completed_at = metadata?.completedAt?.toISOString() || new Date().toISOString();
    updateData.submission_date = new Date().toISOString();
    
    if (metadata?.actualTimeMinutes) {
      updateData.actual_time_minutes = metadata.actualTimeMinutes;
    }
  }
  
  if (metadata?.qualityRating) {
    updateData.quality_rating = metadata.qualityRating;
  }
  
  if (metadata?.feedback) {
    updateData.feedback = metadata.feedback;
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select(`
      *,
      attachments:task_attachments(*)
    `)
    .single();
    
  if (error || !data) {
    console.error('Error updating task status:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
};

export const addTaskAttachment = async (
  taskId: string,
  fileUrl: string,
  fileType?: string,
  fileName?: string
): Promise<TaskAttachment | null> => {
  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName
    })
    .select()
    .single();
    
  if (error || !data) {
    console.error('Error adding task attachment:', error);
    return null;
  }
  
  return {
    id: data.id,
    taskId: data.task_id,
    fileUrl: data.file_url,
    fileType: data.file_type,
    fileName: data.file_name,
    createdAt: new Date(data.created_at)
  };
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }
  
  // First get accepted friendships to mark friends on leaderboard
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('friend_id, user_id')
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
    .eq('status', FriendshipStatus.ACCEPTED);
    
  if (friendError || !friendships) {
    console.error('Error fetching friendships:', friendError);
    return [];
  }
  
  // Extract friend IDs
  const friendIds = friendships.map(f => 
    f.user_id === session.user.id ? f.friend_id : f.user_id
  );
  
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, avatar_url');
    
  if (usersError || !users) {
    console.error('Error fetching users for leaderboard:', usersError);
    return [];
  }
  
  // Get tasks for calculations
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, status, assignee_id, actual_time_minutes, quality_rating, due_date');
    
  if (tasksError || !tasks) {
    console.error('Error fetching tasks for leaderboard:', tasksError);
    return [];
  }
  
  // Calculate leaderboard data manually
  const leaderboardData = users.map(user => {
    // Get tasks assigned to this user
    const userTasks = tasks.filter(task => task.assignee_id === user.id);
    
    // Calculate metrics
    const tasksCompleted = userTasks.filter(task => task.status === 'COMPLETED').length;
    
    const completedTasksWithTime = userTasks.filter(
      task => task.status === 'COMPLETED' && task.actual_time_minutes !== null
    );
    
    const avgCompletionTime = completedTasksWithTime.length 
      ? completedTasksWithTime.reduce((sum, task) => sum + (task.actual_time_minutes || 0), 0) / completedTasksWithTime.length
      : undefined;
    
    const completedTasksWithRating = userTasks.filter(
      task => task.status === 'COMPLETED' && task.quality_rating !== null
    );
    
    const avgQualityRating = completedTasksWithRating.length
      ? completedTasksWithRating.reduce((sum, task) => sum + (task.quality_rating || 0), 0) / completedTasksWithRating.length
      : undefined;
    
    const tasksOverdue = userTasks.filter(task => 
      task.status === 'OVERDUE' || 
      (task.status !== 'COMPLETED' && new Date(task.due_date) < new Date())
    ).length;
    
    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatar_url,
      tasksCompleted,
      avgCompletionTime,
      avgQualityRating,
      tasksOverdue,
      isFriend: friendIds.includes(user.id) || user.id === session.user.id
    };
  });
  
  // Sort leaderboard by tasks completed and quality rating
  return leaderboardData.sort((a, b) => {
    if (a.tasksCompleted !== b.tasksCompleted) {
      return b.tasksCompleted - a.tasksCompleted;
    }
    
    const aRating = a.avgQualityRating || 0;
    const bRating = b.avgQualityRating || 0;
    return bRating - aRating;
  });
};

export const getFriendById = async (friendId: string): Promise<{ friendProfile: User | null; status: FriendshipStatus | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { friendProfile: null, status: null };
  }
  
  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, created_at')
    .eq('id', friendId)
    .single();
    
  if (userError || !userData) {
    console.error('Error fetching friend profile:', userError);
    return { friendProfile: null, status: null };
  }
  
  // Check friendship status
  const { data: friendshipData, error: friendshipError } = await supabase
    .from('friendships')
    .select('status')
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
    .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
    .single();
    
  const friendshipStatus = friendshipData?.status as FriendshipStatus || null;
  
  // Map DB data to User type
  const userProfile: User = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    avatarUrl: userData.avatar_url,
    createdAt: new Date(userData.created_at)
  };
  
  return { 
    friendProfile: userProfile, 
    status: friendshipStatus 
  };
};

export const getLeaderboardDetail = async (leaderboardType: string): Promise<LeaderboardEntry[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }
  
  // Base leaderboard data
  const leaderboardData = await getLeaderboard();
  
  // Filter or modify based on leaderboard type
  switch (leaderboardType) {
    case 'friends':
      return leaderboardData.filter(entry => entry.isFriend);
    case 'weekly':
      // This would need a more complex implementation with date filtering
      return leaderboardData;
    case 'monthly':
      // This would need a more complex implementation with date filtering
      return leaderboardData;
    case 'global':
    default:
      return leaderboardData;
  }
};

// Helper functions
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
    priority: task.priority as TaskPriority,
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
      createdAt: new Date(task.assigner.created_at || Date.now())
    } : undefined,
    assignee: task.assignee ? {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email,
      avatarUrl: task.assignee.avatar_url,
      createdAt: new Date(task.assignee.created_at || Date.now())
    } : undefined
  };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, created_at')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at)
  };
};

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .or(`assignee_id.eq.${userId},assigner_id.eq.${userId}`)
    .order('due_date');
    
  if (error || !data) {
    console.error('Error fetching tasks by user:', error);
    return [];
  }
  
  return data.map(transformTaskFromDb);
};

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('id', taskId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching task by ID:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
}; 