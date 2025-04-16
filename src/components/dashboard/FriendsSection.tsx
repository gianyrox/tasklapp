import React from 'react';
import styles from './FriendsSection.module.css';
import Link from 'next/link';
import Button from '../ui/Button';
import TaskList from '../task/TaskList';
import { Friendship, Task, TaskStatus } from '../../types';

interface FriendsSectionProps {
  friends: Friendship[];
  friendTasks: {[friendId: string]: Task[]};
  isLoading: boolean;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onAddTaskToFriend: (friendId: string, friendName: string) => void;
  onFindFriends: () => void;
}

const FriendsSection: React.FC<FriendsSectionProps> = ({
  friends,
  friendTasks,
  isLoading,
  onStatusChange,
  onAddTaskToFriend,
  onFindFriends
}) => {
  // Debug code to check if friend tasks are loaded
  React.useEffect(() => {
    console.log('Friends section rendered with:', {
      friendsCount: friends.length,
      friendTasksObject: friendTasks,
    });
  }, [friends, friendTasks]);

  return (
    <div className={styles.friendsSection}>
      <div className={styles.sectionHeader}>
        <h2>Friends</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFindFriends}
          className={styles.findFriendsButton}
        >
          Find Friends
        </Button>
      </div>
      
      {isLoading ? (
        <div className={styles.loadingSpinner}></div>
      ) : friends.length > 0 ? (
        <div className={styles.friendTasksGrid}>
          {friends.map(friend => {
            // Determine which ID corresponds to the friend
            const friendId = friend.userId === friend.friendId 
              ? friend.userId 
              : friend.friendId;
              
            // Get friend name from friendship object
            const friendName = friend.friend?.name || 'Friend';
            
            // Get tasks associated with this friend
            const tasks = friendTasks[friendId] || [];
            
            console.log('Friend tasks for', friendName, ':', tasks);
            
            return (
              <div key={friendId} className={styles.friendCard}>
                <div className={styles.friendHeader}>
                  <div className={styles.friendAvatar}>
                    {friend.friend?.avatarUrl ? (
                      <img src={friend.friend.avatarUrl} alt={friendName} />
                    ) : (
                      friendName.charAt(0)
                    )}
                  </div>
                  <h3 className={styles.friendName}>{friendName}</h3>
                </div>
                
                <div className={styles.taskPreview}>
                  {tasks && tasks.length > 0 ? (
                    <>
                      <h4 className={styles.taskPreviewTitle}>
                        Recent Tasks ({tasks.length})
                      </h4>
                      <div className={styles.scrollableBoard}>
                        <TaskList 
                          tasks={tasks.slice(0, 3)} 
                          onStatusChange={onStatusChange}
                          showDetails={false}
                          ownership="friend"
                          compact={true}
                        />
                      </div>
                      {tasks.length > 3 && (
                        <Link href={`/friend/${friendId}`} className={styles.viewMoreLink}>
                          View all tasks
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyTaskState}>
                      <p>No tasks assigned yet</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.friendActions}>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => onAddTaskToFriend(friendId, friendName)}
                  >
                    Assign Task
                  </Button>
                  <Link href={`/friend/${friendId}`}>
                    <Button variant="outline" size="sm">View Profile</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>You don't have any friends yet</p>
          <Button variant="primary" onClick={onFindFriends}>
            Find Friends
          </Button>
        </div>
      )}
    </div>
  );
};

export default FriendsSection; 