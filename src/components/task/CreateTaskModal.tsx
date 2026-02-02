'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { User, Task, TaskPriority, TaskStatus, SubmissionType, Friendship } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import buttonStyles from '../ui/Button.module.css';
import { createTask, getFriendships } from '../../lib/api/supabase';
import styles from './CreateTaskModal.module.css';

interface CreateTaskModalProps {
  assigneeId?: string;
  assigneeName?: string;
  onClose: () => void;
  onCreated: () => void;
}

interface AssignableUser {
  user: User;
  type: 'self' | 'friend';
  friendshipId: string | null;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  assigneeId,
  assigneeName,
  onClose,
  onCreated
}) => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState<number | undefined>();
  const [submissionType, setSubmissionType] = useState<SubmissionType>(SubmissionType.FORM);
  const [submissionInstructions, setSubmissionInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for multiple assignees
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Check if user is a member
  const isMember = user?.membershipType === 'MEMBER' || user?.isMember;

  // Get friend user from friendship
  const getFriendUser = (friendship: Friendship): User | null => {
    if (!user) return null;
    
    // If current user is the friendship creator, return the friend
    if (friendship.userId === user.id) {
      return friendship.friend || null;
    } else {
      // If current user is the friend, we need to get the other user
      // This should be handled by the friendship data structure
      return friendship.friend || null;
    }
  };

  // Create combined list of assignable users (friends + current user)
  const assignableUsers = React.useMemo((): AssignableUser[] => {
    if (!user) return [];
    
    const friendUsers = friends
      .map(friendship => {
        const friendUser = getFriendUser(friendship);
        if (!friendUser) return null;
        return { user: friendUser, type: 'friend' as const, friendshipId: friendship.id };
      })
      .filter(Boolean) as AssignableUser[];
    
    // Add current user to the list
    const currentUserEntry: AssignableUser = { user, type: 'self', friendshipId: null };
    
    return [currentUserEntry, ...friendUsers];
  }, [friends, user]);

  // Load friends on component mount
  useEffect(() => {
    loadFriends();
  }, []);

  // Set initial assignee if provided
  useEffect(() => {
    if (assigneeId && !selectedAssigneeIds.includes(assigneeId)) {
      setSelectedAssigneeIds([assigneeId]);
    }
  }, [assigneeId]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const friendshipData = await getFriendships();
      // Filter for accepted friendships only
      const acceptedFriends = friendshipData.filter(f => f.status === 'ACCEPTED');
      setFriends(acceptedFriends);
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Handle assignee selection
  const handleAssigneeToggle = (friendshipId: string, friendId: string) => {
    if (!isMember && selectedAssigneeIds.length >= 1 && !selectedAssigneeIds.includes(friendId)) {
      // Non-members can only select one assignee
      setSelectedAssigneeIds([friendId]);
      return;
    }

    setSelectedAssigneeIds(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // Get tomorrow's date for default value
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Get current time for default value
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!title || !dueDate) {
        throw new Error('Please fill all required fields');
      }

      if (selectedAssigneeIds.length === 0) {
        throw new Error('Please select at least one assignee');
      }
      
      // Create a proper date object with the selected date and time
      const dueDateObj = new Date(`${dueDate}T${dueTime || '23:59'}:00`);
      
      // Create tasks for each selected assignee
      const taskPromises = selectedAssigneeIds.map(assigneeId => {
        const newTask = {
          title,
          description,
          dueDate: dueDateObj,
          assignerId: user.id,
          assigneeId,
          status: TaskStatus.PENDING,
          priority,
          estimatedTimeMinutes,
          submissionType,
          submissionInstructions: submissionInstructions.trim() || undefined
        };
        
        return createTask(newTask);
      });
      
      // Wait for all tasks to be created
      await Promise.all(taskPromises);
      
      // Notify parent component
      onCreated();
      
      // Close modal
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  // Get selected names for summary
  const getSelectedNames = () => {
    const names = selectedAssigneeIds.map(id => {
      // Check if it's the current user
      if (user && id === user.id) {
        return 'You';
      }
      
      // Otherwise find in friends
      const friendship = friends.find(f => {
        const friendUser = getFriendUser(f);
        return friendUser?.id === id;
      });
      const friendUser = friendship ? getFriendUser(friendship) : null;
      return friendUser?.name || 'Unknown';
    });
    
    if (names.length === 0) return 'No one selected';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create Task</h2>
          <button 
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className={styles.modalContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Assignee Selection Section */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Assign To</label>
              {loadingFriends ? (
                <div className={styles.loadingMessage}>Loading friends...</div>
              ) : assignableUsers.length === 1 ? (
                <div className={styles.noFriendsMessage}>
                  You can assign this task to yourself. Add friends to assign tasks to them as well.
                </div>
              ) : (
                <>
                  <div className={styles.assigneeSelection}>
                    {assignableUsers.map((assignableUserEntry) => {
                      const { user: assignableUser, type, friendshipId } = assignableUserEntry;
                      if (!assignableUser) return null;
                      
                      const isSelected = selectedAssigneeIds.includes(assignableUser.id);
                      
                      return (
                        <div 
                          key={type === 'self' ? 'self' : friendshipId}
                          className={`${styles.assigneeOption} ${isSelected ? styles.selected : ''}`}
                          onClick={() => handleAssigneeToggle(friendshipId || 'self', assignableUser.id)}
                        >
                          <div className={styles.assigneeAvatar}>
                            {assignableUser.avatarUrl ? (
                              <img src={assignableUser.avatarUrl} alt={assignableUser.name} />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {assignableUser.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className={styles.assigneeName}>
                            {type === 'self' ? `${assignableUser.name} (You)` : assignableUser.name}
                          </div>
                          {isSelected && <div className={styles.checkmark}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Membership upgrade message for non-members */}
                  {!isMember && (
                    <div className={styles.membershipMessage}>
                      <div className={styles.membershipIcon}>⭐</div>
                      <div className={styles.membershipContent}>
                        <div className={styles.membershipText}>
                          <strong>Become a Member</strong> to assign tasks to multiple friends at once!
                        </div>
                        <Link 
                          href="/upgrade" 
                          className={`${buttonStyles.button} ${buttonStyles['variant-primary']} ${buttonStyles['size-sm']}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <span className={buttonStyles.leftIcon}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }}>
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                          <span className={buttonStyles.content}>Upgrade</span>
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {/* Selected assignees summary */}
                  {selectedAssigneeIds.length > 0 && (
                    <div className={styles.selectedSummary}>
                      Selected: {getSelectedNames()}
                      {isMember && selectedAssigneeIds.length > 1 && (
                        <span className={styles.multipleCount}>({selectedAssigneeIds.length} people)</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                placeholder="Task title"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                placeholder="Task description"
                rows={4}
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 2 }}>
                <label htmlFor="dueDate" className={styles.label}>Due Date *</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate || getTomorrowDate()}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="dueTime" className={styles.label}>Time</label>
                <input
                  type="time"
                  id="dueTime"
                  value={dueTime || getCurrentTime()}
                  onChange={(e) => setDueTime(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="priority" className={styles.label}>Priority</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={styles.select}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="estimatedTime" className={styles.label}>Estimated Time (minutes)</label>
                <input
                  type="number"
                  id="estimatedTime"
                  value={estimatedTimeMinutes || ''}
                  onChange={(e) => setEstimatedTimeMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1"
                  className={styles.input}
                  placeholder="e.g. 30"
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Submission Type</label>
              <div className={styles.submissionTypeContainer}>
                <div 
                  className={`${styles.typeOption} ${submissionType === SubmissionType.FORM ? styles.selected : ''}`}
                  onClick={() => setSubmissionType(SubmissionType.FORM)}
                >
                  <span>Text</span>
                </div>
                <div 
                  className={`${styles.typeOption} ${submissionType === SubmissionType.LINK ? styles.selected : ''}`}
                  onClick={() => setSubmissionType(SubmissionType.LINK)}
                >
                  <span>Link</span>
                </div>
                <div 
                  className={`${styles.typeOption} ${submissionType === SubmissionType.FILE ? styles.selected : ''}`}
                  onClick={() => setSubmissionType(SubmissionType.FILE)}
                >
                  <span>File</span>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="submissionInstructions" className={styles.label}>Submission Instructions</label>
              <textarea
                id="submissionInstructions"
                value={submissionInstructions}
                onChange={(e) => setSubmissionInstructions(e.target.value)}
                className={styles.textarea}
                placeholder="Instructions for how the task should be submitted"
                rows={3}
              />
            </div>
            
            <div className={styles.formActions}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSubmitting || selectedAssigneeIds.length === 0}
              >
                {isSubmitting ? 'Creating...' : 
                  selectedAssigneeIds.length > 1 ? `Create ${selectedAssigneeIds.length} Tasks` : 'Create Task'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal; 