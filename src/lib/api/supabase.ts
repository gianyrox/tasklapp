import { createClient } from '@supabase/supabase-js';
import { Task, TaskStatus, TaskPriority, User, Friendship, FriendshipStatus, LeaderboardEntry, TaskAttachment, SubmissionType } from '../../types';
import { computeUserMetrics, ScoringTask } from '../scoring';
import { trackTaskEvent } from '../analytics';

// Logger utility for consistent logging
const logger = {
  info: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [${context}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  },
  
  error: (context: string, message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${context}] ${message}${error ? '\n' + JSON.stringify(error, null, 2) : ''}`);
  },
  
  warn: (context: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [${context}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  },
  
  debug: (context: string, message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] [${context}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
    }
  }
};

// Initialize Supabase client with performance optimizations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a simple, reliable Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to get session with timeout protection
const getSessionWithTimeout = async (timeoutMs: number = 10000) => {
  logger.info('getSessionWithTimeout', `Attempting to get session with ${timeoutMs}ms timeout`);
  
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => {
          logger.error('getSessionWithTimeout', 'Session call timed out');
          reject(new Error('Session timeout'));
        }, timeoutMs)
      )
    ]) as Promise<{ data: { session: any }, error: any }>;
    
    logger.info('getSessionWithTimeout', 'Session retrieved successfully');
    return result;
          } catch (error) {
    logger.error('getSessionWithTimeout', 'Session retrieval failed:', error);
    throw error;
  }
};

// Cache to store session to avoid repeated auth.getSession() calls
let sessionCache: {
  session: any;
  timestamp: number;
} | null = null;

// Helper function to create friendship if needed
const createFriendshipIfNeeded = async (userId: string, friendId: string): Promise<void> => {
  try {
    logger.info('createFriendshipIfNeeded', `Checking friendship between ${userId} and ${friendId}`);
    
    // Check if friendship already exists (bidirectional check)
    const { data: existingFriendship, error: checkError } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();

    if (checkError) {
      logger.error('createFriendshipIfNeeded', 'Error checking existing friendship:', checkError);
            return;
          }

    if (existingFriendship) {
      logger.info('createFriendshipIfNeeded', `Friendship already exists with status: ${existingFriendship.status}`);
      return;
    }

    // Create new friendship
    logger.info('createFriendshipIfNeeded', `Creating new friendship between ${userId} and ${friendId}`);
    const { data: newFriendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: FriendshipStatus.ACCEPTED // Auto-accept for invitations
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('createFriendshipIfNeeded', 'Error creating friendship:', insertError);
            return;
          }

    logger.info('createFriendshipIfNeeded', `Successfully created friendship with ID: ${newFriendship?.id}`);
          } catch (error) {
    logger.error('createFriendshipIfNeeded', 'Unexpected error in friendship creation:', error);
    // Don't fail the invitation if friendship creation fails
  }
};

// Helper function to find user by email with multiple fallback methods
async function findUserByEmail(email: string): Promise<any> {
  logger.info('findUserByEmail', `Starting search for user with email: ${email}`);
  
  try {
    // Simplified approach - just use exact match with proper error handling
    logger.info('findUserByEmail', 'Attempting exact match query...');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, is_pending')
      .eq('email', email)
      .maybeSingle();
    
    logger.info('findUserByEmail', `Query completed. Error: ${error ? JSON.stringify(error) : 'none'}, User found: ${user ? 'yes' : 'no'}`);
    
    if (error) {
      logger.error('findUserByEmail', `Database error for email ${email}:`, error);
      return null;
    }
    
    if (user) {
      logger.info('findUserByEmail', `Found user: ${user.id} (pending: ${user.is_pending || false})`);
      return user;
    } else {
      logger.info('findUserByEmail', `No user found with email: ${email}`);
      return null;
    }
    
  } catch (error) {
    logger.error('findUserByEmail', `Unexpected error searching for user with email ${email}:`, error);
    return null;
  }
}

// More optimized session getter
export const getSession = async () => {
  try {
    // Check if there was a recent auth event (sign in/out) that would invalidate our cache
    if (typeof window !== 'undefined') {
      try {
        const lastAuthEvent = sessionStorage.getItem('last_auth_event');
        if (lastAuthEvent) {
          const { timestamp } = JSON.parse(lastAuthEvent);
          // If we have a recent auth event, invalidate the cache
          if (Date.now() - timestamp < 5000) { // Within last 5 seconds
            sessionCache = null;
            // Clear the auth event after using it
            sessionStorage.removeItem('last_auth_event');
          }
        }
      } catch (e) {
        console.error('Error checking auth events:', e);
      }
    }
    
    // Check cache first (valid for 60 seconds)
    if (sessionCache && Date.now() - sessionCache.timestamp < 60000) {
      return { data: { session: sessionCache.session } };
    }

    // Get fresh session and cache it
    const result = await supabase.auth.getSession();
    
    if (result.data.session) {
      sessionCache = {
        session: result.data.session,
        timestamp: Date.now()
      };
    } else {
      sessionCache = null;
    }
    
    return result;
  } catch (error) {
    console.error('Error in getSession:', error);
    // If we have an error, fallback to direct call
    return supabase.auth.getSession();
  }
};

// User API functions
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    logger.info('getCurrentUser', 'Getting current user...');
    // Get session data
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      logger.warn('getCurrentUser', 'No active session found');
      return null;
    }
    
    logger.info('getCurrentUser', `Session found, user ID: ${session.user.id}`);
    
    let userIdToQuery = session.user.id;
    
    if (session.user.email) {
      const { data: pendingUser, error: pendingError } = await supabase
        .from('users')
        .select('id, is_pending, invitation_token')
        .eq('email', session.user.email)
        .eq('is_pending', true)
        .maybeSingle();
        
      if (pendingUser && !pendingError) {
        logger.info('getCurrentUser', `Activating pending user ${pendingUser.id} for auth user ${session.user.id}`);
        
        const { data: activated, error: activationError } = await supabase
          .rpc('activate_pending_user', {
            user_id: pendingUser.id,
            auth_user_id: session.user.id
          });
          
        if (activationError) {
          logger.error('getCurrentUser', 'Failed to activate pending user:', activationError);
          try {
            const { addLog } = await import('../logging');
            await addLog({
              userId: session.user.id,
              category: 'ERROR' as any,
              action: 'pending_user_activation_failed',
              details: { error: activationError.message }
            });
          } catch (logError) {
            logger.error('getCurrentUser', 'Failed to log activation error:', logError);
          }
        } else {
          logger.info('getCurrentUser', 'Pending user activated successfully');
          userIdToQuery = session.user.id;
        }
      }
    }
    
    let result = await supabase
      .from('users')
      .select('id, name, email, avatar_url, created_at, is_pending, membership_type, stripe_customer_id, membership_expires_at')
      .eq('id', userIdToQuery)
      .single();
    
    if (!result.data && !result.error?.message?.includes('Invalid input syntax')) {
      logger.info('getCurrentUser', 'Creating new user profile');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'New User',
          avatar_url: session.user.user_metadata?.avatar_url,
          is_pending: false,
          membership_type: 'FREE',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        logger.error('getCurrentUser', 'Error creating user profile:', insertError);
        
        if (insertError.code === '23505') {
          logger.info('getCurrentUser', 'User profile already exists, fetching it');
          result = await supabase
            .from('users')
            .select('id, name, email, avatar_url, created_at, is_pending, membership_type, stripe_customer_id, membership_expires_at')
            .eq('id', session.user.id)
            .single();
        } else {
          return null;
        }
      } else {
        result = await supabase
          .from('users')
          .select('id, name, email, avatar_url, created_at, is_pending, membership_type, stripe_customer_id, membership_expires_at')
          .eq('id', session.user.id)
          .single();
      }
    }
    
    if (result.error || !result.data) {
      logger.error('getCurrentUser', 'Error fetching user profile:', result.error);
      return null;
    }
    
    // Type assertion for the result data
    const userData = result.data as {
      id: string;
      name: string;
      email: string;
      avatar_url?: string;
      created_at: string;
      is_pending?: boolean;
      membership_type?: 'FREE' | 'MEMBER';
      stripe_customer_id?: string;
      membership_expires_at?: string;
    };

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatar_url,
      createdAt: new Date(userData.created_at),
      membershipType: userData.membership_type || 'FREE',
      stripeCustomerId: userData.stripe_customer_id,
      membershipExpiresAt: userData.membership_expires_at ? new Date(userData.membership_expires_at) : undefined,
      isPending: userData.is_pending || false,
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    };

  } catch (error) {
    logger.error('getCurrentUser', 'Unexpected error:', error);
    return null;
  }
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
  console.log('Getting all users...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*, stats:user_stats(*)')
    .order('name');
    
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    console.log('No users found');
    return [];
  }
  
  console.log(`Found ${data.length} users`);
  console.log('First user data sample:', JSON.stringify(data[0], null, 2));
  
  // Define type for user data from database
  type UserDB = {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
    stats: {
      tasks_completed?: number;
      tasks_assigned?: number; 
      average_completion_time?: number;
      completion_rate?: number;
      rank?: number;
    } | null;
  };
  
  // Cast data to our defined type
  const usersData = data as unknown as UserDB[];
  
  const users = usersData.map((user: UserDB) => {
    console.log(`Processing user ${user.id}: ${user.name}`);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: new Date(user.created_at),
      membershipType: 'FREE' as const, // Default to FREE
      stats: {
        tasksCompleted: user.stats?.tasks_completed || 0,
        completionRate: user.stats?.completion_rate || 0,
        averageCompletionTime: user.stats?.average_completion_time || 0,
        rank: user.stats?.rank || 0
      }
    };
  });
  
  console.log(`Returning ${users.length} processed users`);
  return users;
};

// Friend management functions
export const getFriendships = async (status?: FriendshipStatus): Promise<Friendship[]> => {
  logger.info('getFriendships', `Getting friendships with status: ${status || 'all'}`);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    logger.warn('getFriendships', 'No active session found');
    return [];
  }
  
  logger.info('getFriendships', `Fetching friendships for user: ${session.user.id}`);
  
  let query = supabase
    .from('friendships')
    .select(`
      *,
      requester:users!friendships_user_id_fkey(id, name, email, avatar_url, created_at),
      recipient:users!friendships_friend_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
    
  if (error) {
    logger.error('getFriendships', 'Error fetching friendships:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    logger.warn('getFriendships', 'No friendships found');
    return [];
  }
  
  logger.info('getFriendships', `Found ${data.length} friendships`);
  
  // Define type for friendship data from database
  type FriendshipDB = {
    id: string;
    user_id: string;
    friend_id: string;
    status: FriendshipStatus;
    created_at: string;
    updated_at: string;
    requester?: {
      id: string;
      name: string;
      email: string;
      avatar_url?: string;
      created_at: string;
    } | null;
    recipient?: {
      id: string;
      name: string;
      email: string;
      avatar_url?: string;
      created_at: string;
    } | null;
  };
  
  // Cast data to our defined type
  const friendshipsData = data as unknown as FriendshipDB[];
  
  return friendshipsData.map(friendship => {
    // Determine which user is the friend (not the current user)
    const isUserRequester = friendship.user_id === session.user.id;
    const friendData = isUserRequester 
      ? friendship.recipient 
      : friendship.requester;
    
    logger.debug('getFriendships', `Processing friendship ${friendship.id}, friend data:`, friendData);
    
    return {
      id: friendship.id,
      userId: friendship.user_id,
      friendId: friendship.friend_id,
      status: friendship.status,
      createdAt: new Date(friendship.created_at),
      updatedAt: new Date(friendship.updated_at),
      friend: friendData ? {
        id: friendData.id,
        name: friendData.name,
        email: friendData.email,
        avatarUrl: friendData.avatar_url,
        createdAt: new Date(friendData.created_at),
        membershipType: 'FREE', // Default to FREE for friends
        stats: {
          rank: 0,
          tasksCompleted: 0,
          completionRate: 0,
          averageCompletionTime: 0
        }
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
  console.log(`Searching users with query: "${query}"`);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log('No active session found, cannot search users');
    return [];
  }
  
  if (!query || query.length < 3) {
    console.log('Query too short, minimum 3 characters required');
    return [];
  }
  
  console.log(`Searching for "${query}" excluding current user: ${session.user.id}`);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', session.user.id)
    .limit(10);
    
  if (error) {
    console.error('Error searching users:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    console.log('No users found matching query');
    return [];
  }
  
  console.log(`Found ${data.length} users matching query"`);
  
  // Cast data to known structure
  type UserDB = {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  };
  
  const usersData = data as unknown as UserDB[];
  
  const users = usersData.map((user: UserDB) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    createdAt: new Date(user.created_at),
    membershipType: 'FREE' as 'FREE' | 'MEMBER',
    stats: {
      rank: 0,
      tasksCompleted: 0,
      completionRate: 0,
      averageCompletionTime: 0
    }
  }));
  
  return users;
};

// Task API functions
export const getUserTasks = async (userId: string): Promise<Task[]> => {
  logger.info('getUserTasks', `Fetching all tasks for user: ${userId}`);
  
  // Get ALL tasks assigned to the user (not just from friends)
  const { data: assignedTasks, error: assignedError } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url)
    `)
    .eq('assignee_id', userId)
    .order('created_at', { ascending: false });
    
  if (assignedError || !assignedTasks) {
    logger.error('getUserTasks', 'Error fetching user tasks:', assignedError);
    return [];
  }
  
  logger.info('getUserTasks', `Found ${assignedTasks.length} tasks for user`);
  return assignedTasks.map(transformTaskFromDb);
};

export const getUserAssignedTasks = async (userId: string): Promise<Task[]> => {
  // Get tasks assigned by the user to others
  const { data: assignedTasks, error: assignedError } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url)
    `)
    .eq('assigner_id', userId)
    .neq('assignee_id', userId); // Exclude tasks assigned to oneself
    
  if (assignedError || !assignedTasks) {
    console.error('Error fetching user assigned tasks:', assignedError);
    return [];
  }
  
  return assignedTasks.map(transformTaskFromDb);
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
  // Define the type for the task data returned from the insert
  interface InsertedTaskData {
    id: string;
    title: string;
    description: string;
    created_at: string;
    due_date: string;
    assigner_id: string;
    assignee_id: string | null;
    status: string;
    priority: string;
    completed_at?: string;
    estimated_time_minutes?: number;
    actual_time_minutes?: number;
    submission_date?: string;
    quality_rating?: number;
    feedback?: string;
    submission_type?: string;
    submission_instructions?: string;
    started_at?: string;
    submission_content?: string;
    timeliness_rating?: number;
    effort_rating?: number;
    accuracy_rating?: number;
    is_invitation: boolean;
    email_pending?: string;
  }

  // Create the task first
  const { data: rawData, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description,
      due_date: task.dueDate.toISOString(),
      assigner_id: task.assignerId,
      assignee_id: task.assigneeId || null, // Handle optional assigneeId
      status: task.status,
      priority: task.priority,
      completed_at: task.completedAt?.toISOString(),
      estimated_time_minutes: task.estimatedTimeMinutes,
      actual_time_minutes: task.actualTimeMinutes,
      submission_date: task.submissionDate?.toISOString(),
      quality_rating: task.qualityRating,
      feedback: task.feedback,
      submission_type: task.submissionType,
      submission_instructions: task.submissionInstructions,
      is_invitation: task.isInvitation,
      email_pending: task.emailPending
    })
    .select()
    .single();
    
  if (error || !rawData) {
    console.error('Error creating task:', error);
    return null;
  }
  
  // Type assert the data to our expected structure
  const data = rawData as unknown as InsertedTaskData;

  // Instrument the assignment (spec §6): peer vs self is the key signal.
  trackTaskEvent('assign', {
    taskId: data.id,
    assignerId: task.assignerId,
    assigneeId: task.assigneeId,
    actorId: task.assignerId,
    extra: { priority: task.priority, isInvitation: !!task.isInvitation },
  });

  // Send email notification if task is assigned to someone other than the creator AND assigneeId exists
  if (task.assigneeId && task.assignerId !== task.assigneeId) {
    try {
      // Fetch assignee and assigner data separately for the notification
      const [assigneeResult, assignerResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, email')
          .eq('id', task.assigneeId)
          .single(),
        supabase
          .from('users')
          .select('id, name, email')
          .eq('id', task.assignerId)
          .single()
      ]);

      if (assigneeResult.data && assignerResult.data) {
        // Call the edge function directly using supabase.functions.invoke
        const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('notify-task-assignment', {
          body: {
            type: 'assignment',
            assigneeEmail: assigneeResult.data.email,
            assigneeName: assigneeResult.data.name,
            assignerName: assignerResult.data.name,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.dueDate.toISOString(),
            taskId: data.id
          }
        });

        if (notificationError) {
          console.error('Failed to send task assignment notification:', notificationError);
          // Don't fail the task creation if notification fails
        } else {
          console.log('Task assignment notification sent successfully:', notificationResult);
        }
      } else {
        console.error('Could not fetch user data for notification:', {
          assigneeError: assigneeResult.error,
          assignerError: assignerResult.error
        });
      }
    } catch (notificationError) {
      console.error('Error setting up task assignment notification:', notificationError);
      // Don't fail the task creation if notification setup fails
    }
  }

  // Now fetch the complete task data with relationships for the return value
  const { data: completeTask, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('id', data.id)
    .single();
    
  if (fetchError || !completeTask) {
    console.error('Error fetching complete task data:', fetchError);
    // Return a basic task object if relationship fetch fails
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      createdAt: new Date(data.created_at),
      dueDate: new Date(data.due_date),
      assignerId: data.assigner_id,
      assigneeId: data.assignee_id || undefined,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      estimatedTimeMinutes: data.estimated_time_minutes,
      actualTimeMinutes: data.actual_time_minutes,
      submissionType: data.submission_type as SubmissionType | undefined,
      submissionInstructions: data.submission_instructions,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      submissionDate: data.submission_date ? new Date(data.submission_date) : undefined,
      submissionContent: data.submission_content,
      qualityRating: data.quality_rating,
      timelinessRating: data.timeliness_rating,
      effortRating: data.effort_rating,
      accuracyRating: data.accuracy_rating,
      feedback: data.feedback,
      isInvitation: data.is_invitation,
      emailPending: data.email_pending,
      attachments: []
    };
  }
  
  return transformTaskFromDb(completeTask);
};

export const updateTaskStatus = async (
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
  
  if (metadata?.timelinessRating) {
    updateData.timeliness_rating = metadata.timelinessRating;
  }
  
  if (metadata?.effortRating) {
    updateData.effort_rating = metadata.effortRating;
  }
  
  if (metadata?.accuracyRating) {
    updateData.accuracy_rating = metadata.accuracyRating;
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
  
  const transformedTask = transformTaskFromDb(data);

  // Instrument loop transitions (spec §6). Actor is the assignee for
  // start/submit and the assigner for grade.
  const eventType =
    status === TaskStatus.IN_PROGRESS ? 'start' :
    status === TaskStatus.COMPLETED ? 'submit' :
    status === TaskStatus.GRADED ? 'grade' : null;
  if (eventType) {
    trackTaskEvent(eventType, {
      taskId: transformedTask.id,
      assignerId: transformedTask.assignerId,
      assigneeId: transformedTask.assigneeId,
      actorId: eventType === 'grade' ? transformedTask.assignerId : transformedTask.assigneeId,
    });
  }

  // Send notifications based on the type of update
  try {
    // Check if this is a task completion (status changed to COMPLETED) or has grading
    const hasGrading = metadata?.qualityRating || metadata?.timelinessRating || 
                      metadata?.effortRating || metadata?.accuracyRating || metadata?.feedback;
    
    if ((status === TaskStatus.COMPLETED || hasGrading) && (data as any).assigner_id && (data as any).assignee_id) {
      // Fetch user data separately for notifications
      const [assignerResult, assigneeResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, email')
          .eq('id', (data as any).assigner_id)
          .single(),
        supabase
          .from('users')
          .select('id, name, email')
          .eq('id', (data as any).assignee_id)
          .single()
      ]);

      if (assignerResult.data && assigneeResult.data) {
        // Send completion notification to the assigner if task was just completed
        if (status === TaskStatus.COMPLETED) {
          const { error: notificationError } = await supabase.functions.invoke('notify-task-assignment', {
            body: {
              type: 'completion',
              taskId: transformedTask.id,
              taskTitle: transformedTask.title,
              taskDescription: transformedTask.description,
              assignerEmail: assignerResult.data.email,
              assignerName: assignerResult.data.name,
              assigneeName: assigneeResult.data.name,
              completedAt: transformedTask.completedAt?.toISOString() || new Date().toISOString(),
              submissionContent: transformedTask.submissionContent
            }
          });

          if (notificationError) {
            console.error('Failed to send task completion notification:', notificationError);
          } else {
            console.log('Task completion notification sent successfully');
          }
        }

        // Send grading notification to the assignee if grading was provided
        if (hasGrading) {
          const { error: gradingNotificationError } = await supabase.functions.invoke('notify-task-assignment', {
            body: {
              type: 'grading',
              taskId: transformedTask.id,
              taskTitle: transformedTask.title,
              taskDescription: transformedTask.description,
              assigneeEmail: assigneeResult.data.email,
              assigneeName: assigneeResult.data.name,
              assignerName: assignerResult.data.name,
              qualityRating: metadata?.qualityRating,
              timelinessRating: metadata?.timelinessRating,
              effortRating: metadata?.effortRating,
              accuracyRating: metadata?.accuracyRating,
              feedback: metadata?.feedback
            }
          });

          if (gradingNotificationError) {
            console.error('Failed to send task grading notification:', gradingNotificationError);
          } else {
            console.log('Task grading notification sent successfully');
          }
        }
      } else {
        console.error('Could not fetch user data for notifications:', {
          assignerError: assignerResult.error,
          assigneeError: assigneeResult.error
        });
      }
    }
  } catch (notificationError) {
    console.error('Error setting up task notifications:', notificationError);
    // Don't fail the task update if notification fails
  }
  
  return transformedTask;
};

export const updateTaskSubmissionType = async (
  taskId: string,
  submissionType: SubmissionType
): Promise<Task | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('No active session found, cannot update task submission type');
    return null;
  }
  
  const updateData = { 
    submission_type: submissionType
  };
  
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
    console.error('Error updating task submission type:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
};

export const updateTaskSubmissionContent = async (
  taskId: string,
  submissionContent: string
): Promise<Task | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('No active session found, cannot update task submission content');
    return null;
  }
  
  const updateData = { 
    submission_content: submissionContent
  };
  
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
    console.error('Error updating task submission content:', error);
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
  logger.info('addTaskAttachment', `Adding attachment to task ${taskId}`);
  
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
    
  if (error) {
    logger.error('addTaskAttachment', 'Error adding task attachment:', error);
    return null;
  }
  
  if (!data) {
    logger.error('addTaskAttachment', 'No data returned when adding task attachment');
    return null;
  }
  
  // Define type for attachment data from database
  type AttachmentDB = {
    id: string;
    task_id: string;
    file_url: string;
    file_type?: string;
    file_name?: string;
    created_at: string;
  };
  
  // Cast data to our defined type
  const attachmentData = data as unknown as AttachmentDB;
  
  logger.debug('addTaskAttachment', 'Attachment added successfully:', attachmentData);
  
  return {
    id: attachmentData.id,
    taskId: attachmentData.task_id,
    fileUrl: attachmentData.file_url,
    fileType: attachmentData.file_type,
    fileName: attachmentData.file_name,
    createdAt: new Date(attachmentData.created_at)
  };
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return [];
  }
  
  // Define types for Supabase query results
  interface UserRecord {
    id: string;
    name: string;
    avatar_url?: string;
  }
  
  interface TaskRecord {
    id: string;
    status: string;
    assignee_id: string;
    actual_time_minutes: number | null;
    quality_rating: number | null;
    timeliness_rating: number | null;
    effort_rating: number | null;
    accuracy_rating: number | null;
    due_date: string;
    completed_at: string | null;
    submission_date: string | null;
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
    .select('id, name, avatar_url')
    .returns<UserRecord[]>();
    
  if (usersError || !users) {
    console.error('Error fetching users for leaderboard:', usersError);
    return [];
  }
  
  // Get tasks for calculations
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, status, assignee_id, actual_time_minutes, quality_rating, timeliness_rating, effort_rating, accuracy_rating, due_date, completed_at, submission_date')
    .returns<TaskRecord[]>();

  if (tasksError || !tasks) {
    console.error('Error fetching tasks for leaderboard:', tasksError);
    return [];
  }

  const now = new Date();

  // Build the composite-score leaderboard (spec §3.3). Metrics + score come
  // from lib/scoring so the formula is shared and unit-tested.
  const leaderboardData: LeaderboardEntry[] = users.map(user => {
    const userTasks: ScoringTask[] = tasks
      .filter(task => task.assignee_id === user.id)
      .map(task => ({
        status: task.status,
        qualityRating: task.quality_rating,
        timelinessRating: task.timeliness_rating,
        effortRating: task.effort_rating,
        accuracyRating: task.accuracy_rating,
        actualTimeMinutes: task.actual_time_minutes,
        dueDate: task.due_date,
        completedAt: task.completed_at,
        submissionDate: task.submission_date,
      }));

    const m = computeUserMetrics(userTasks, now);

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatar_url,
      tasksCompleted: m.tasksCompleted,
      avgCompletionTime: m.avgCompletionTime,
      avgQualityRating: m.avgQualityRating,
      avgTimelinessRating: m.avgTimelinessRating,
      avgEffortRating: m.avgEffortRating,
      avgAccuracyRating: m.avgAccuracyRating,
      tasksOverdue: m.tasksOverdue,
      perfectTasks: m.perfectTasks,
      tasksOnTime: m.tasksOnTime,
      fastestCompletionTime: m.fastestCompletionTime,
      compositeScore: m.compositeScore,
      isFriend: friendIds.includes(user.id) || user.id === session.user.id
    };
  });

  // Rank by composite score (quality-weighted), then completed volume.
  return leaderboardData.sort((a, b) => {
    const aScore = a.compositeScore || 0;
    const bScore = b.compositeScore || 0;
    if (aScore !== bScore) return bScore - aScore;
    return b.tasksCompleted - a.tasksCompleted;
  });
};

export const getFriendById = async (friendId: string): Promise<{ friendProfile: User | null; status: FriendshipStatus | null }> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { friendProfile: null, status: null };
  }
  
  // Define the type for user data returned from Supabase
  interface UserDBRecord {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  }
  
  // Get user profile with typed response
  const { data, error: userError } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, created_at')
    .eq('id', friendId)
    .single<UserDBRecord>();
    
  if (userError || !data) {
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
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at),
    membershipType: 'FREE',
    stats: {
      rank: 0,
      tasksCompleted: 0,
      completionRate: 0,
      averageCompletionTime: 0
    }
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
  console.log(`Transforming task ${task.id}: "${task.title}"`);
  
  if (!task) {
    console.error('Received null or undefined task to transform');
    throw new Error('Cannot transform null task');
  }
  
  // Check for required fields
  if (!task.id || !task.title || !task.due_date) {
    console.error('Task missing required fields:', JSON.stringify(task, null, 2));
  }
  
  // Define types for the task and related data
  interface TaskAttachmentDB {
    id: string;
    task_id: string;
    file_url: string;
    file_type?: string;
    file_name?: string;
    created_at: string;
  }
  
  interface UserDB {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at?: string;
  }
  
  // Log attachment data if present
  if (task.attachments && task.attachments.length > 0) {
    console.log(`Task has ${task.attachments.length} attachments`);
  }
  
  // Create the transformed task object
  const transformedTask: Task = {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: new Date(task.created_at),
    dueDate: new Date(task.due_date),
    assignerId: task.assigner_id,
    assigneeId: task.assignee_id || undefined, // Handle null assignee_id for invitations
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    estimatedTimeMinutes: task.estimated_time_minutes,
    actualTimeMinutes: task.actual_time_minutes,
    submissionType: task.submission_type,
    submissionInstructions: task.submission_instructions,
    startedAt: task.started_at ? new Date(task.started_at) : undefined,
    submissionDate: task.submission_date ? new Date(task.submission_date) : undefined,
    submissionContent: task.submission_content,
    qualityRating: task.quality_rating,
    timelinessRating: task.timeliness_rating,
    effortRating: task.effort_rating,
    accuracyRating: task.accuracy_rating,
    feedback: task.feedback,
    isInvitation: task.is_invitation,
    emailPending: task.email_pending,
    attachments: task.attachments ? task.attachments.map((attachment: TaskAttachmentDB) => ({
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
      membershipType: 'FREE',
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
      membershipType: 'FREE',
      stats: {
        rank: 0,
        tasksCompleted: 0,
        completionRate: 0,
        averageCompletionTime: 0
      }
    } : undefined
  };
  
  return transformedTask;
};

export const getUserById = async (userId: string): Promise<User | null> => {
  // Define the type for user data returned from Supabase
  interface UserDBRecord {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, created_at')
    .eq('id', userId)
    .single<UserDBRecord>();
    
  if (error || !data) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: new Date(data.created_at),
    membershipType: 'FREE',
    stats: {
      rank: 0,
      tasksCompleted: 0,
      completionRate: 0,
      averageCompletionTime: 0
    }
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
  // Define interface for task data from database
  interface TaskWithRelations {
    id: string;
    title: string;
    description: string;
    created_at: string;
    due_date: string;
    assigner_id: string;
    assignee_id: string;
    status: string;
    priority: string;
    completed_at?: string;
    estimated_time_minutes?: number;
    actual_time_minutes?: number;
    submission_type?: string;
    submission_instructions?: string;
    started_at?: string;
    submission_date?: string;
    submission_content?: string;
    quality_rating?: number;
    timeliness_rating?: number;
    effort_rating?: number;
    accuracy_rating?: number;
    feedback?: string;
    attachments: any[];
    assigner?: any;
    assignee?: any;
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      attachments:task_attachments(*),
      assigner:users!tasks_assigner_id_fkey(id, name, email, avatar_url, created_at),
      assignee:users!tasks_assignee_id_fkey(id, name, email, avatar_url, created_at)
    `)
    .eq('id', taskId)
    .single<TaskWithRelations>();
    
  if (error || !data) {
    console.error('Error fetching task by ID:', error);
    return null;
  }
  
  return transformTaskFromDb(data);
};

export const getSelfAssignedTasks = async (userId: string): Promise<Task[]> => {
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
  
  return data.map(transformTaskFromDb);
};

export const getTasksAssignedToOthers = async (userId: string): Promise<Task[]> => {
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
  
  return data.map(transformTaskFromDb);
};

export const createInvitationTask = async (
  email: string,
  taskTitle: string,
  taskDescription: string,
  dueDate: Date,
  priority: TaskPriority = TaskPriority.MEDIUM
): Promise<{ success: boolean; taskId?: string; error?: string }> => {
  try {
    logger.info('createInvitationTask', `Creating invitation task for email: ${email}`);
    
    logger.info('createInvitationTask', 'Step 1: Getting session...');
    // Use timeout-protected session getter to avoid hanging
    let session: any;
    try {
      const { data: sessionData, error: sessionError } = await getSessionWithTimeout(10000);
      if (sessionError || !sessionData.session) {
        logger.error('createInvitationTask', 'No valid session found:', sessionError);
        return { success: false, error: 'No active session found' };
      }
      session = sessionData.session;
      logger.info('createInvitationTask', `Step 1 complete: Session found for user ${session.user.id}`);
    } catch (sessionError) {
      logger.error('createInvitationTask', 'Session timeout or error:', sessionError);
      // Try one more time with direct call as fallback
      try {
        logger.info('createInvitationTask', 'Attempting direct session call as fallback...');
        const { data: { session: fallbackSession }, error: fallbackError } = await supabase.auth.getSession();
        if (fallbackError || !fallbackSession) {
          logger.error('createInvitationTask', 'Fallback session also failed:', fallbackError);
          return { success: false, error: 'Unable to authenticate - please refresh and try again' };
        }
        session = fallbackSession;
        logger.info('createInvitationTask', `Fallback session successful for user ${session.user.id}`);
      } catch (fallbackError) {
        logger.error('createInvitationTask', 'Both session methods failed:', fallbackError);
        return { success: false, error: 'Authentication failed - please refresh the page and try again' };
      }
    }

    // Look for existing user first
    logger.info('createInvitationTask', 'Step 2: Looking for existing user...');
    const existingUser = await findUserByEmail(email);
    logger.info('createInvitationTask', `Step 2 complete: Existing user ${existingUser ? 'found' : 'not found'}`);
    
    let assigneeId: string | null = null;
    let isInvitation = false;
    let emailPending: string | null = null;

    if (existingUser) {
      // User already exists - assign directly
      assigneeId = existingUser.id;
      isInvitation = false;
      emailPending = null;
      
      logger.info('createInvitationTask', `Step 3a: Assigning task directly to existing user ${existingUser.id}`);
    } else {
      // User doesn't exist - create invitation task
      assigneeId = null;
      isInvitation = true;
      emailPending = email;
      
      logger.info('createInvitationTask', `Step 3b: Creating invitation task for email ${email}`);
    }

    // Create the task
    logger.info('createInvitationTask', 'Step 4: Creating task...');
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: taskTitle,
        description: taskDescription,
        due_date: dueDate.toISOString(),
        assigner_id: session.user.id,
        assignee_id: assigneeId,
        status: TaskStatus.PENDING,
        priority: priority,
        submission_type: 'text',
        submission_instructions: 'Please complete this task and submit your response.',
        is_invitation: isInvitation,
        email_pending: emailPending
      })
      .select('id')
      .single();

    logger.info('createInvitationTask', `Step 4 complete: Task creation - Success: ${!!task}, Error: ${taskError ? JSON.stringify(taskError) : 'none'}`);

    if (taskError || !task) {
      logger.error('createInvitationTask', 'Error creating task:', taskError);
      return { success: false, error: 'Failed to create task' };
    }

    // Type assertion for the task data
    const taskData = task as { id: string };

    // Create friendship if user exists
    if (existingUser) {
      logger.info('createInvitationTask', 'Step 5: Creating friendship...');
      try {
        await createFriendshipIfNeeded(session.user.id, existingUser.id);
        logger.info('createInvitationTask', 'Step 5 complete: Friendship created/verified');
      } catch (friendshipError) {
        logger.warn('createInvitationTask', 'Step 5 failed: Failed to create friendship:', friendshipError);
        // Don't fail the task creation if friendship fails
      }
    } else {
      logger.info('createInvitationTask', 'Step 5 skipped: No friendship needed for invitation task');
    }

    logger.info('createInvitationTask', `Task created successfully: ${taskData.id}`);

    // Send invitation email if this is an invitation task
    if (isInvitation && emailPending) {
      logger.info('createInvitationTask', 'Step 6: Sending invitation email...');
      try {
        // Get the assigner's information for the email
        const { data: assignerData, error: assignerError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', session.user.id)
          .single();

        if (assignerData && !assignerError) {
          // Send invitation email using the edge function
          const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('notify-task-assignment', {
            body: {
              type: 'invitation',
              assigneeEmail: emailPending,
              assigneeName: emailPending.split('@')[0], // Use email prefix as temporary name
              assignerName: assignerData.name,
              taskTitle: taskTitle,
              taskDescription: taskDescription,
              dueDate: dueDate.toISOString(),
              taskId: taskData.id,
              isNewUser: true // Since we're creating this because user doesn't exist
            }
          });

          if (notificationError) {
            logger.error('createInvitationTask', 'Failed to send invitation email:', notificationError);
            // Don't fail the task creation if email fails
          } else {
            logger.info('createInvitationTask', 'Step 6 complete: Invitation email sent successfully');
          }
        } else {
          logger.error('createInvitationTask', 'Could not fetch assigner data for invitation email:', assignerError);
        }
      } catch (emailError) {
        logger.error('createInvitationTask', 'Error sending invitation email:', emailError);
        // Don't fail the task creation if email fails
      }
    } else {
      logger.info('createInvitationTask', 'Step 6 skipped: No invitation email needed');
    }

    return { success: true, taskId: taskData.id };

  } catch (error) {
    logger.error('createInvitationTask', 'Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}; 