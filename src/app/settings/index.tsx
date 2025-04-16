'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import Button from '../../components/ui/Button';
import { updateUserProfile } from '../../lib/api/supabase';

// Create a CSS module for the settings page
const styles = {
  container: {
    padding: '2rem 0',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    marginBottom: '2rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    padding: '0 0 0.75rem 0',
    borderBottom: '1px solid #eee',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.25rem',
    border: '1px solid #ddd',
    fontSize: '1rem',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#6B46C1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    marginRight: '1.5rem',
    overflow: 'hidden',
  },
  avatarUpload: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  saveButton: {
    backgroundColor: '#6B46C1',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    color: '#666',
    padding: '0.5rem 1rem',
    borderRadius: '0.25rem',
    border: '1px solid #ddd',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  message: {
    padding: '1rem',
    borderRadius: '0.25rem',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
  },
};

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

  const handleSave = async () => {
    setIsUpdating(true);
    setMessage(null);
    
    try {
      // Only update what's changed
      const updateData: { name?: string; avatarUrl?: string } = {};
      
      if (name !== user?.name) updateData.name = name;
      if (avatarUrl !== user?.avatarUrl) updateData.avatarUrl = avatarUrl;
      
      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'success', text: 'No changes to save' });
        setIsUpdating(false);
        return;
      }
      
      const success = await updateUserProfile(updateData);
      
      if (success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // Refresh page after successful update to see the changes
        setTimeout(() => router.refresh(), 1500);
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
          <div style={styles.container}>
            <div style={styles.header}>
              <h1 style={styles.title}>Settings</h1>
              <p style={styles.subtitle}>Loading your profile information...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Settings</h1>
            <p style={styles.subtitle}>Manage your account settings and profile</p>
          </div>
          
          {message && (
            <div style={{ ...styles.message, ...(message.type === 'success' ? styles.success : styles.error) }}>
              {message.text}
            </div>
          )}
          
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Profile Information</h2>
            
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div style={styles.avatarUpload}>
                <h3 style={{ marginBottom: '0.5rem' }}>Profile Picture</h3>
                <p style={{ color: '#666', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Add a URL to your profile picture
                </p>
                <input
                  type="text"
                  value={avatarUrl || ''}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                style={{ ...styles.input, backgroundColor: '#f9f9f9' }}
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Email cannot be changed. Contact support for help.
              </p>
            </div>
            
            <div style={styles.buttonGroup}>
              <button
                onClick={() => {
                  setName(user?.name || '');
                  setAvatarUrl(user?.avatarUrl || '');
                  setMessage(null);
                }}
                style={styles.cancelButton}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={styles.saveButton}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Account Preferences</h2>
            
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Account preferences will be available in a future update.
            </p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default SettingsPage;
