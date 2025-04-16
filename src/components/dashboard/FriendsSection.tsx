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
            const friendId = friend.userId === friend.friendId ? friend.userId : friend.friendId;
            const tasks = friendTasks[friendId] || [];
            
            return (
              <div key={friendId} className={styles.friendCard}>
                <div className={styles.friendHeader}>
                  <div className={styles.friendAvatar}>
                    {friend.friend?.avatarUrl ? (
                      <img src={friend.friend.avatarUrl} alt={friend.friend.name} />
                    ) : (
                      friend.friend?.name.charAt(0)
                    )}
                  </div>
                  <h3 className={styles.friendName}>{friend.friend?.name}</h3>
                </div>
                
                <div className={styles.taskPreview}>
                  {tasks.length > 0 ? (
                    <>
                      <h4 className={styles.taskPreviewTitle}>
                        Recent Tasks ({tasks.length})
                      </h4>
                      <div className={styles.scrollableBoard}>
                        <TaskList 
                          tasks={tasks.slice(0, 3)} 
                          onStatusChange={onStatusChange}
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
                      <p>No tasks yet</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.friendActions}>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => onAddTaskToFriend(friendId, friend.friend?.name || 'Friend')}
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