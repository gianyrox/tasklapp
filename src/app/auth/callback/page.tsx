'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/api/supabase';
import styles from './Callback.module.css';
import { addLog } from '../../../lib/logging';
import { LogCategory } from '../../../../confy/types';

// Fallback component
const CallbackFallback = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <div className={styles.loadingSpinner}></div>
        <h2>Preparing authentication...</h2>
        <p>Just a moment while we process your login.</p>
      </div>
    </div>
  );
};

// Main component that uses searchParams
const AuthCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Authenticating...');
  const [redirecting, setRedirecting] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Add detailed logging for debugging
      console.log('Auth callback page loaded', {
        url: window.location.href,
        hash: window.location.hash.length > 0 ? '(hash present)' : '(no hash)',
        searchParams: Object.fromEntries(searchParams.entries()),
        hasCode: searchParams.has('code')
      });
      
      // UPDATED: Note about the new API route handler
      // When this page loads with a 'code' parameter, the server-side API handler at 
      // /api/auth/callback/supabase will also be processing the same code in parallel.
      // This page serves as a fallback UI while that happens, and for cases where client-side
      // processing is needed, such as with hash fragments.
      
      try {
        // Log initial state
        await addLog({
          category: LogCategory.AUTH,
          action: 'auth_callback_page_loaded',
          details: {
            url: window.location.href.split('?')[0], // don't log full URL with tokens
            hasCode: searchParams.has('code'),
            hasHash: Boolean(window.location.hash),
            timestamp: new Date().toISOString()
          }
        });
        
        // First verify if we already have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          await addLog({
            category: LogCategory.ERROR,
            action: 'auth_callback_session_error',
            details: { error: sessionError.message }
          });
          setError('Authentication failed. Please try logging in again.');
          setStatus('Authentication error');
          return;
        }
        
        if (sessionData?.session) {
          // We already have a valid session
          console.log('Valid session detected in callback page');
          await addLog({
            userId: sessionData.session.user.id,
            category: LogCategory.AUTH,
            action: 'auth_callback_valid_session',
            details: { 
              hasCookies: document.cookie.includes('supabase-auth'),
              provider: sessionData.session.user.app_metadata?.provider
            }
          });
          
          setStatus('Session verified, redirecting...');
          setRedirecting(true);
          
          // Short delay to allow logs to be sent
          setTimeout(() => {
            // Get redirect from query params or default to dashboard
            const redirect = searchParams.get('redirect') || '/dashboard';
            window.location.href = redirect;
          }, 1000);
          return;
        }
        
        // Check for code in URL (for OAuth and magic links)
        if (searchParams.has('code')) {
          setStatus('Processing authentication code...');
          
          await addLog({
            category: LogCategory.AUTH,
            action: 'auth_callback_processing_code',
            details: { hasCode: true }
          });
          
          // The server-side route handler should have already processed the code
          // We'll check if we have a session after a short delay
          setTimeout(async () => {
            const { data: sessionCheck } = await supabase.auth.getSession();
            
            if (sessionCheck?.session) {
              console.log('Session successfully established via route handler');
              await addLog({
                userId: sessionCheck.session.user.id,
                category: LogCategory.AUTH,
                action: 'auth_callback_session_verified',
                details: { provider: sessionCheck.session.user.app_metadata?.provider }
              });
              
              setStatus('Authentication successful, redirecting...');
              setRedirecting(true);
              
              // Get redirect from query params or default to dashboard
              const redirect = searchParams.get('redirect') || '/dashboard';
              window.location.href = redirect;
            } else {
              // If no session found, we'll try client-side verification with hash
              console.log('No session established via route handler, checking hash params');
              await addLog({
                category: LogCategory.AUTH,
                action: 'auth_callback_no_session_from_route',
                details: { hasHash: window.location.hash.length > 0 }
              });
              
              // Try to handle hash fragment for magic links
              if (window.location.hash) {
                await handleHashFragment();
              } else {
                setError('Authentication failed. Please try logging in again.');
                setStatus('Authentication error');
                
                await addLog({
                  category: LogCategory.ERROR,
                  action: 'auth_callback_no_session_no_hash',
                  details: { url: window.location.pathname }
                });
              }
            }
          }, 1500);
        } else if (window.location.hash) {
          // Handle hash fragment directly (for magic links)
          await handleHashFragment();
        } else {
          // No authentication data found
          setError('No authentication data found. Please try logging in again.');
          setStatus('Authentication error');
          
          await addLog({
            category: LogCategory.ERROR,
            action: 'auth_callback_no_auth_data',
            details: { 
              url: window.location.pathname,
              hasQueryParams: window.location.search.length > 0
            }
          });
        }
      } catch (e) {
        console.error('Unexpected error:', e);
        await addLog({
          category: LogCategory.ERROR,
          action: 'auth_callback_unexpected_error',
          details: { error: String(e) }
        });
        setError('An unexpected error occurred. Please try again.');
        setStatus('Error');
      }
    };

    // Handle hash fragment for magic links
    const handleHashFragment = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
          setStatus('Processing login tokens...');
          
          console.log('Setting session from hash tokens');
          await addLog({
            category: LogCategory.AUTH,
            action: 'auth_callback_processing_hash',
            details: { hasAccessToken: true }
          });
          
          // Set session with tokens from hash
          const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: hashParams.get('access_token')!,
            refresh_token: hashParams.get('refresh_token')!,
          });
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            await addLog({
              category: LogCategory.ERROR,
              action: 'auth_callback_set_session_error',
              details: { error: setSessionError.message }
            });
            setError('Failed to authenticate. Please try again.');
            setStatus('Authentication error');
            return false;
          }
          
          if (sessionData?.session) {
            // Clear the hash from URL for security
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Log success
            await addLog({
              userId: sessionData.session.user.id,
              category: LogCategory.AUTH,
              action: 'auth_callback_session_set_success',
              details: { 
                provider: sessionData.session.user.app_metadata?.provider,
                cookiesPresent: document.cookie.includes('supabase-auth')
              }
            });
            
            setStatus('Authentication successful, redirecting...');
            setRedirecting(true);
            
            // Redirect to dashboard or specified redirect
            const redirect = searchParams.get('redirect') || '/dashboard';
            
            // Short delay to allow logs to be sent
            setTimeout(() => {
              window.location.href = redirect;
            }, 1000);
            
            return true;
          }
        } else {
          await addLog({
            category: LogCategory.ERROR,
            action: 'auth_callback_invalid_hash',
            details: { hashLength: window.location.hash.length }
          });
          setError('Invalid authentication tokens. Please try logging in again.');
          setStatus('Authentication error');
          return false;
        }
      } catch (e) {
        console.error('Error processing hash tokens:', e);
        await addLog({
          category: LogCategory.ERROR,
          action: 'auth_callback_hash_processing_error',
          details: { error: String(e) }
        });
        setError('An error occurred while processing authentication. Please try again.');
        setStatus('Authentication error');
        return false;
      }
      return false;
    };

    handleAuthCallback();
  }, [router, searchParams]);

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
            <h2>{status}</h2>
            <p>{redirecting ? 'Taking you to your dashboard...' : 'Just a moment while we log you in.'}</p>
          </>
        )}
      </div>
    </div>
  );
};

// Page component that wraps the content with Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
} 