'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import BackButton from '../../components/ui/BackButton';
import { updateUserProfile, supabase, createInvitationTask } from '../../lib/api/supabase';
import { TaskPriority } from '../../types';

// Import CSS modules
import styles from './Settings.module.css';

const SettingsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTaskTitle, setInviteTaskTitle] = useState('');
  const [inviteTaskDescription, setInviteTaskDescription] = useState('');
  const [inviteDueDate, setInviteDueDate] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Get user initials for avatar placeholder
  const getInitials = () => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const handleFindFriends = () => {
    // Navigate to the friend search page
    router.push('/friend');
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    setMessage(null);
    
    try {
      // Only update what's changed
      const updateData: { name?: string; avatarUrl?: string } = {};
      
      if (name !== user.name) updateData.name = name;
      if (avatarUrl !== user.avatarUrl) updateData.avatarUrl = avatarUrl;
      
      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'success', text: 'No changes to save' });
        setIsUpdating(false);
        return;
      }
      
      // Let updateUserProfile handle both the Auth metadata and database updates
      const success = await updateUserProfile(updateData);
      
      if (success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        
        // Force a hard reload to ensure all components get the updated user data
        // This is more reliable than just refreshing the router
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating your profile' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!user || !inviteEmail || !inviteTaskTitle || !inviteDueDate) {
      setMessage({
        text: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setMessage({
        text: 'Please enter a valid email address',
        type: 'error'
      });
      return;
    }

    // Validate due date is in the future
    const dueDateTime = new Date(inviteDueDate);
    if (dueDateTime <= new Date()) {
      setMessage({
        text: 'Due date must be in the future',
        type: 'error'
      });
      return;
    }

    setIsInviting(true);
    setMessage(null);

    try {
      const result = await createInvitationTask(
        inviteEmail,
        inviteTaskTitle,
        inviteTaskDescription || 'Complete this task to get started with TaskLapp!',
        dueDateTime,
        TaskPriority.MEDIUM
      );

      if (result.success) {
        setMessage({
          text: `Invitation sent successfully to ${inviteEmail}!`,
          type: 'success'
        });
        
        // Reset form
        setInviteEmail('');
        setInviteTaskTitle('');
        setInviteTaskDescription('');
        setInviteDueDate('');
        setShowInviteForm(false);
      } else {
        setMessage({
          text: result.error || 'Failed to send invitation',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setMessage({
        text: 'An error occurred while sending the invitation',
        type: 'error'
      });
    } finally {
      setIsInviting(false);
    }
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.container}>
            <div className={styles.header}>
              <h1 className={styles.title}>Settings</h1>
              <p className={styles.subtitle}>Loading your profile information...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <BackButton route="/dashboard" />
          
          <div className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Manage your account settings and profile</p>
          </div>
          
          {message && (
            <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
              {message.text}
            </div>
          )}
          
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Profile Information</h2>
            
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className={styles.avatarImage} />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div className={styles.avatarUpload}>
                <h3 className={styles.avatarTitle}>Profile Picture</h3>
                <p className={styles.avatarHint}>
                  Add a URL to your profile picture
                </p>
                <input
                  type="text"
                  value={avatarUrl || ''}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className={`${styles.input} ${styles.disabledInput}`}
              />
              <p className={styles.inputHint}>
                Email cannot be changed. Contact support for help.
              </p>
            </div>
            
            <div className={styles.buttonGroup}>
              <button
                onClick={() => {
                  setName(user?.name || '');
                  setAvatarUrl(user?.avatarUrl || '');
                  setMessage(null);
                }}
                className={styles.cancelButton}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={styles.saveButton}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Social Connections</h2>
            <p className={styles.inputHint}>
              Connect with friends to assign tasks and compete on the leaderboard.
            </p>
            <div className={styles.socialActions}>
              <button onClick={handleFindFriends} className={styles.findFriendsButton}>
                Find Friends
              </button>
              <button 
                onClick={() => setShowInviteForm(!showInviteForm)} 
                className={styles.inviteButton}
              >
                {showInviteForm ? 'Cancel Invite' : 'Invite by Email'}
              </button>
            </div>

            {showInviteForm && (
              <div className={styles.inviteForm}>
                <h3 className={styles.inviteFormTitle}>Send Task Invitation</h3>
                <p className={styles.inviteFormDescription}>
                  Invite someone to join TaskLapp by sending them a task!
                </p>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address *</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Task Title *</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Welcome to TaskLapp!"
                    value={inviteTaskTitle}
                    onChange={(e) => setInviteTaskTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Task Description</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="A simple task to get you started with TaskLapp..."
                    value={inviteTaskDescription}
                    onChange={(e) => setInviteTaskDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Due Date *</label>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={inviteDueDate}
                    onChange={(e) => setInviteDueDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className={styles.inviteFormActions}>
                  <button 
                    onClick={() => setShowInviteForm(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendInvitation}
                    disabled={isInviting || !inviteEmail || !inviteTaskTitle || !inviteDueDate}
                    className={styles.saveButton}
                  >
                    {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Account Preferences</h2>
            
            <p className={styles.inputHint}>
              Account preferences will be available in a future update.
            </p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default SettingsPage; 