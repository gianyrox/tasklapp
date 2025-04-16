'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import BackButton from '../../components/ui/BackButton';
import { updateUserProfile, supabase } from '../../lib/api/supabase';

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
      
      // First update the Auth metadata to ensure consistency
      await supabase.auth.updateUser({
        data: {
          name: updateData.name,
          avatar_url: updateData.avatarUrl
        }
      });
      
      // Then update the profile in the database
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
          <div className={styles.header}>
            <BackButton route="/dashboard" />
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
            </div>
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