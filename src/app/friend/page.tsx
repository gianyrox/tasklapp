'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { 
  getFriendships, 
  searchUsers, 
  sendFriendRequest, 
  respondToFriendRequest,
  getAllUsers
} from '../../lib/api/supabase';
import { User, Friendship, FriendshipStatus } from '../../types';

import styles from './Friend.module.css';

const FriendPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Load friends data on component mount
  useEffect(() => {
    if (user) {
      fetchFriendsData();
      fetchAllUsers();
    }
  }, [user]);

  const fetchAllUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Error fetching all users:', err);
    }
  };

  const fetchFriendsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all friendships
      const allFriendships = await getFriendships();
      
      // Filter friendships by status
      const accepted = allFriendships.filter(f => f.status === FriendshipStatus.ACCEPTED);
      const pending = allFriendships.filter(
        f => f.status === FriendshipStatus.PENDING && f.friendId === user?.id
      );
      const sent = allFriendships.filter(
        f => f.status === FriendshipStatus.PENDING && f.userId === user?.id
      );
      
      setFriends(accepted);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (err) {
      console.error('Error fetching friends data:', err);
      setError('Failed to load friends data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 3) {
      setStatusMessage({
        text: 'Please enter at least 3 characters to search',
        type: 'error'
      });
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    
    try {
      const results = await searchUsers(searchQuery);
      
      // Filter out users that are already friends or have pending requests
      const allRelatedUserIds = [
        ...friends.map(f => f.userId === user?.id ? f.friendId : f.userId),
        ...pendingRequests.map(f => f.userId),
        ...sentRequests.map(f => f.friendId)
      ];
      
      const filteredResults = results.filter(
        result => !allRelatedUserIds.includes(result.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search for users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const success = await sendFriendRequest(friendId);
      
      if (success) {
        // Refresh the friends data
        await fetchFriendsData();
        
        // Remove the user from search results
        setSearchResults(prev => prev.filter(user => user.id !== friendId));
        
        setStatusMessage({
          text: 'Friend request sent successfully',
          type: 'success'
        });
      } else {
        setStatusMessage({
          text: 'Failed to send friend request',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      setStatusMessage({
        text: 'An error occurred while sending the friend request',
        type: 'error'
      });
    }
  };

  const handleRespondToRequest = async (friendshipId: string, accept: boolean) => {
    try {
      const success = await respondToFriendRequest(friendshipId, accept);
      
      if (success) {
        // Refresh the friends data
        await fetchFriendsData();
        
        setStatusMessage({
          text: accept ? 'Friend request accepted' : 'Friend request declined',
          type: 'success'
        });
      } else {
        setStatusMessage({
          text: 'Failed to respond to friend request',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error responding to friend request:', err);
      setStatusMessage({
        text: 'An error occurred while responding to the friend request',
        type: 'error'
      });
    }
  };

  const handleViewFriend = (friendId: string) => {
    router.push(`/friend/${friendId}`);
  };

  // Helper to get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Check if a user is already a friend or has a pending request
  const getRelationshipStatus = (otherUserId: string): 'none' | 'friend' | 'pending' | 'sent' => {
    // Check if already friends
    if (friends.some(f => 
      (f.userId === user?.id && f.friendId === otherUserId) || 
      (f.friendId === user?.id && f.userId === otherUserId)
    )) {
      return 'friend';
    }
    
    // Check if we received a request from them
    if (pendingRequests.some(f => f.userId === otherUserId)) {
      return 'pending';
    }
    
    // Check if we sent a request to them
    if (sentRequests.some(f => f.friendId === otherUserId)) {
      return 'sent';
    }
    
    return 'none';
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Friends & Connections</h1>
            <p className={styles.subtitle}>Find, add, and manage your connections</p>
          </div>

          {statusMessage && (
            <div className={`${styles.message} ${statusMessage.type === 'success' ? styles.success : styles.error}`}>
              {statusMessage.text}
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
              <Button size="sm" variant="primary" onClick={fetchFriendsData}>
                Try Again
              </Button>
            </div>
          )}

          {/* Search Section */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Find Friends</h2>
            <p className={styles.cardDescription}>
              Search for people by name or email to connect and start assigning tasks.
            </p>
            
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                variant="primary" 
                size="md" 
                onClick={handleSearch}
                disabled={isSearching || searchQuery.length < 3}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className={styles.searchResults}>
                <h3 className={styles.sectionTitle}>Search Results</h3>
                <div className={styles.userGrid}>
                  {searchResults.map(searchUser => (
                    <div key={searchUser.id} className={styles.userCard}>
                      <div className={styles.userAvatarContainer}>
                        {searchUser.avatarUrl ? (
                          <img 
                            src={searchUser.avatarUrl} 
                            alt={searchUser.name} 
                            className={styles.userAvatar} 
                          />
                        ) : (
                          <div className={styles.userAvatarPlaceholder}>
                            {getUserInitials(searchUser.name)}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4 className={styles.userName}>{searchUser.name}</h4>
                        <p className={styles.userEmail}>{searchUser.email}</p>
                      </div>
                      <div className={styles.userActions}>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleSendFriendRequest(searchUser.id)}
                        >
                          Send Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              searchQuery.length >= 3 && !isSearching && (
                <div className={styles.emptyState}>
                  <p>No users found matching '{searchQuery}'</p>
                </div>
              )
            )}
          </div>

          {/* Pending Friend Requests */}
          {pendingRequests.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                Pending Requests <span className={styles.badgeCount}>{pendingRequests.length}</span>
              </h2>
              <div className={styles.userGrid}>
                {pendingRequests.map(request => {
                  const requestUser = request.friend || { 
                    name: 'Unknown User', 
                    email: '', 
                    avatarUrl: '' 
                  };
                  
                  return (
                    <div key={request.id} className={styles.userCard}>
                      <div className={styles.userAvatarContainer}>
                        {requestUser.avatarUrl ? (
                          <img 
                            src={requestUser.avatarUrl} 
                            alt={requestUser.name} 
                            className={styles.userAvatar} 
                          />
                        ) : (
                          <div className={styles.userAvatarPlaceholder}>
                            {getUserInitials(requestUser.name)}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4 className={styles.userName}>{requestUser.name}</h4>
                        <p className={styles.userEmail}>{requestUser.email}</p>
                      </div>
                      <div className={styles.userActions}>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleRespondToRequest(request.id, true)}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRespondToRequest(request.id, false)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sent Friend Requests */}
          {sentRequests.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                Sent Requests <span className={styles.badgeCount}>{sentRequests.length}</span>
              </h2>
              <div className={styles.userGrid}>
                {sentRequests.map(request => {
                  const requestUser = request.friend || { 
                    name: 'Unknown User', 
                    email: '', 
                    avatarUrl: '' 
                  };
                  
                  return (
                    <div key={request.id} className={styles.userCard}>
                      <div className={styles.userAvatarContainer}>
                        {requestUser.avatarUrl ? (
                          <img 
                            src={requestUser.avatarUrl} 
                            alt={requestUser.name} 
                            className={styles.userAvatar} 
                          />
                        ) : (
                          <div className={styles.userAvatarPlaceholder}>
                            {getUserInitials(requestUser.name)}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4 className={styles.userName}>{requestUser.name}</h4>
                        <p className={styles.userEmail}>{requestUser.email}</p>
                        <span className={styles.pendingStatus}>Pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My Friends */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              My Friends {friends.length > 0 && <span className={styles.badgeCount}>{friends.length}</span>}
            </h2>
            
            {friends.length > 0 ? (
              <div className={styles.userGrid}>
                {friends.map(friendship => {
                  const friendId = friendship.userId === user?.id ? friendship.friendId : friendship.userId;
                  const friendUser = friendship.friend || { 
                    name: 'Unknown User', 
                    email: '', 
                    avatarUrl: '' 
                  };
                  
                  return (
                    <div key={friendship.id} className={styles.userCard}>
                      <div className={styles.userAvatarContainer}>
                        {friendUser.avatarUrl ? (
                          <img 
                            src={friendUser.avatarUrl} 
                            alt={friendUser.name} 
                            className={styles.userAvatar} 
                          />
                        ) : (
                          <div className={styles.userAvatarPlaceholder}>
                            {getUserInitials(friendUser.name)}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4 className={styles.userName}>{friendUser.name}</h4>
                        <p className={styles.userEmail}>{friendUser.email}</p>
                      </div>
                      <div className={styles.userActions}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewFriend(friendId)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>You don't have any friends yet. Search for users to add friends!</p>
              </div>
            )}
          </div>

          {/* All Users */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              All Users <span className={styles.badgeCount}>{allUsers.length}</span>
            </h2>
            
            {allUsers.length > 0 ? (
              <div className={styles.userGrid}>
                {allUsers
                  .filter(otherUser => otherUser.id !== user?.id) // Exclude current user
                  .map(otherUser => {
                    const relationshipStatus = getRelationshipStatus(otherUser.id);
                    
                    return (
                      <div key={otherUser.id} className={styles.userCard}>
                        <div className={styles.userAvatarContainer}>
                          {otherUser.avatarUrl ? (
                            <img 
                              src={otherUser.avatarUrl} 
                              alt={otherUser.name} 
                              className={styles.userAvatar} 
                            />
                          ) : (
                            <div className={styles.userAvatarPlaceholder}>
                              {getUserInitials(otherUser.name)}
                            </div>
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <h4 className={styles.userName}>{otherUser.name}</h4>
                          <p className={styles.userEmail}>{otherUser.email}</p>
                          
                          {relationshipStatus === 'friend' && (
                            <span className={styles.friendStatus}>Friend</span>
                          )}
                          
                          {relationshipStatus === 'pending' && (
                            <span className={styles.pendingStatus}>Request Received</span>
                          )}
                          
                          {relationshipStatus === 'sent' && (
                            <span className={styles.pendingStatus}>Request Sent</span>
                          )}
                        </div>
                        <div className={styles.userActions}>
                          {/* View Profile button for all users */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewFriend(otherUser.id)}
                          >
                            View Profile
                          </Button>
                          
                          {/* Add Friend button for users who are not friends or have pending requests */}
                          {relationshipStatus === 'none' && (
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleSendFriendRequest(otherUser.id)}
                            >
                              Add Friend
                            </Button>
                          )}
                          
                          {/* Accept/Decline buttons for pending friend requests */}
                          {relationshipStatus === 'pending' && (
                            <>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => {
                                  const request = pendingRequests.find(r => r.userId === otherUser.id);
                                  if (request) handleRespondToRequest(request.id, true);
                                }}
                              >
                                Accept
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const request = pendingRequests.find(r => r.userId === otherUser.id);
                                  if (request) handleRespondToRequest(request.id, false);
                                }}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No other users found in the system.</p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default FriendPage;
