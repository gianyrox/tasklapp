'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/api/supabase';
import styles from './Callback.module.css';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Process the token directly
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError('Authentication failed. Please try logging in again.');
          return;
        }
        
        if (data?.session) {
          // We have a session, redirect to dashboard
          router.push('/dashboard');
        } else {
          // Check if there's a hash in the URL (for magic link)
          if (typeof window !== 'undefined' && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
              try {
                // Set session with tokens from hash
                const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
                  access_token: hashParams.get('access_token')!,
                  refresh_token: hashParams.get('refresh_token')!,
                });
                
                if (setSessionError) {
                  console.error('Error setting session:', setSessionError);
                  setError('Failed to authenticate. Please try again.');
                  return;
                }
                
                if (sessionData?.session) {
                  // Clear the hash from URL for security
                  window.history.replaceState({}, document.title, window.location.pathname);
                  // Redirect to dashboard
                  router.push('/dashboard');
                }
              } catch (e) {
                console.error('Error processing tokens:', e);
                setError('An unexpected error occurred. Please try again.');
              }
            } else {
              setError('Invalid authentication tokens. Please try logging in again.');
            }
          } else {
            setError('No authentication data found. Please try logging in again.');
          }
        }
      } catch (e) {
        console.error('Unexpected error:', e);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        {error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>!</div>
            <h2>Authentication Error</h2>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => router.push('/login')}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <>
            <div className={styles.loadingSpinner}></div>
            <h2>Authenticating...</h2>
            <p>Just a moment while we log you in.</p>
          </>
        )}
      </div>
    </div>
  );
} 