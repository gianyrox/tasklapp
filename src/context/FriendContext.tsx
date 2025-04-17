'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Friendship, FriendshipStatus, User, LogCategory } from '../../confy/types';
import { supabase } from '../lib/api/supabase';
import { useAuth } from './AuthContext';
import { useLogging } from './LoggingContext';

type FriendContextType = {
  friends: Friendship[];
  pendingRequests: Friendship[];
  sentRequests: Friendship[];
  isLoading: boolean;
  error: string | null;
  refreshFriends: () => Promise<void>;
  sendFriendRequest: (friendId: string) => Promise<boolean>;
  acceptFriendRequest: (friendshipId: string) => Promise<boolean>;
  declineFriendRequest: (friendshipId: string) => Promise<boolean>;
  removeFriend: (friendshipId: string) => Promise<boolean>;
};

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export function FriendProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { log } = useLogging();
  
  // Derived friendship lists
  const pendingRequests = friends.filter(friendship => 
    friendship.status === FriendshipStatus.PENDING && friendship.friendId === user?.id
  );
  
  const sentRequests = friends.filter(friendship => 
    friendship.status === FriendshipStatus.PENDING && friendship.userId === user?.id
  );
  
  // Load friendships from the database
  const loadFriends = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await log({
        category: LogCategory.FRIEND,
        action: 'friends_loading',
        details: { userId: user.id }
      });
      
      // Get all friendships where the user is either the sender or recipient
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:users!friendships_friend_id_fkey(id, name, email, avatar_url, created_at)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Transform data to application types
      const transformedFriendships = data.map(friendship => {
        // Set friend data based on which side of the friendship the user is on
        const friend = friendship.friend as any;
        const friendData: User = {
          id: friend.id,
          email: friend.email || '',
          name: friend.name || friend.display_name || friend.username || 'User',
          avatarUrl: friend.avatar_url || '',
          createdAt: new Date(friend.created_at as string),
          stats: {
            rank: 0, // These would be populated in a real app
            tasksCompleted: 0,
            completionRate: 0,
            averageCompletionTime: 0
          }
        };
        
        return {
          id: friendship.id as string,
          userId: friendship.user_id as string,
          friendId: friendship.friend_id as string,
          status: friendship.status as FriendshipStatus,
          createdAt: new Date(friendship.created_at as string),
          updatedAt: new Date(friendship.updated_at as string),
          friend: friendData
        };
      });
      
      setFriends(transformedFriendships);
      
      await log({
        category: LogCategory.FRIEND,
        action: 'friends_loaded',
        details: { 
          total: transformedFriendships.length,
          accepted: transformedFriendships.filter(f => f.status === FriendshipStatus.ACCEPTED).length,
          pending: transformedFriendships.filter(f => f.status === FriendshipStatus.PENDING).length
        }
      });
    } catch (err) {
      console.error('Error fetching friendships:', err);
      setError('Failed to load friends');
      
      await log({
        category: LogCategory.ERROR,
        action: 'friends_load_failed',
        details: { error: String(err) }
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, log]);
  
  // Send a friend request
  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!user?.id) return false;
    
    try {
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_request_sending',
        details: { friendId }
      });
      
      // Check if a request already exists
      const { data: existingData } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
        
      if (existingData && existingData.length > 0) {
        throw new Error('A friendship or request already exists with this user');
      }
      
      // Create the friend request
      const { data, error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: FriendshipStatus.PENDING
        })
        .select();
        
      if (insertError) {
        throw insertError;
      }
      
      // Refresh the friends list
      await loadFriends();
      
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_request_sent',
        details: { friendId, friendshipId: data[0].id }
      });
      
      return true;
    } catch (err) {
      console.error('Error sending friend request:', err);
      
      await log({
        category: LogCategory.ERROR,
        action: 'friend_request_failed',
        details: { friendId, error: String(err) }
      });
      
      return false;
    }
  }, [user?.id, loadFriends, log]);
  
  // Accept a friend request
  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user?.id) return false;
    
    try {
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_request_accepting',
        details: { friendshipId }
      });
      
      // Get the friendship
      const friendship = friends.find(f => f.id === friendshipId);
      if (!friendship) {
        throw new Error('Friendship not found');
      }
      
      // Update the friendship status
      const { error: updateError } = await supabase
        .from('friendships')
        .update({
          status: FriendshipStatus.ACCEPTED,
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setFriends(prevFriends => 
        prevFriends.map(f => 
          f.id === friendshipId 
            ? { ...f, status: FriendshipStatus.ACCEPTED, updatedAt: new Date() } 
            : f
        )
      );
      
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_request_accepted',
        details: { 
          friendshipId,
          friendId: friendship.friendId === user.id ? friendship.userId : friendship.friendId
        }
      });
      
      return true;
    } catch (err) {
      console.error('Error accepting friend request:', err);
      
      await log({
        category: LogCategory.ERROR,
        action: 'friend_accept_failed',
        details: { friendshipId, error: String(err) }
      });
      
      return false;
    }
  }, [user?.id, friends, log]);
  
  // Decline a friend request
  const declineFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user?.id) return false;
    
    try {
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_request_declining',
        details: { friendshipId }
      });
      
      // Get the friendship
      const friendship = friends.find(f => f.id === friendshipId);
      if (!friendship) {
        throw new Error('Friendship not found');
      }
      
      // Update the friendship status
      const { error: updateError } = await supabase
        .from('friendships')
        .update({
          status: FriendshipStatus.DECLINED,
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setFriends(prevFriends => 
        prevFriends.map(f => 
          f.id === friendshipId 
            ? { ...f, status: FriendshipStatus.DECLINED, updatedAt: new Date() } 
            : f
        )
      );
      
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_request_declined',
        details: { 
          friendshipId,
          friendId: friendship.friendId === user.id ? friendship.userId : friendship.friendId
        }
      });
      
      return true;
    } catch (err) {
      console.error('Error declining friend request:', err);
      
      await log({
        category: LogCategory.ERROR,
        action: 'friend_decline_failed',
        details: { friendshipId, error: String(err) }
      });
      
      return false;
    }
  }, [user?.id, friends, log]);
  
  // Remove a friend
  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!user?.id) return false;
    
    try {
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_removing',
        details: { friendshipId }
      });
      
      // Get the friendship
      const friendship = friends.find(f => f.id === friendshipId);
      if (!friendship) {
        throw new Error('Friendship not found');
      }
      
      // Delete the friendship
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Update local state
      setFriends(prevFriends => prevFriends.filter(f => f.id !== friendshipId));
      
      await log({
        category: LogCategory.FRIEND,
        action: 'friend_removed',
        details: { 
          friendshipId,
          friendId: friendship.friendId === user.id ? friendship.userId : friendship.friendId
        }
      });
      
      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      
      await log({
        category: LogCategory.ERROR,
        action: 'friend_remove_failed',
        details: { friendshipId, error: String(err) }
      });
      
      return false;
    }
  }, [user?.id, friends, log]);
  
  // Public refresh function
  const refreshFriends = useCallback(async () => {
    await loadFriends();
  }, [loadFriends]);
  
  // Load friends on mount and when user changes
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);
  
  return (
    <FriendContext.Provider 
      value={{ 
        friends: friends.filter(f => f.status === FriendshipStatus.ACCEPTED),
        pendingRequests,
        sentRequests,
        isLoading, 
        error, 
        refreshFriends,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend
      }}
    >
      {children}
    </FriendContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendContext);
  
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendProvider');
  }
  
  return context;
} 