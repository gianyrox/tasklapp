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
  const [status, setStatus] = useState<string>('Checking authentication...');
  const [redirecting, setRedirecting] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Add detailed logging for debugging
      console.log('Auth callback page loaded', {
        url: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries())
      });
      
      // NOTE: With OTP authentication, most verification happens directly on the login/signup pages.
      // This callback page primarily handles edge cases, OAuth redirects, or legacy magic link flows.
      
      try {
        // Log initial state
        await addLog({
          category: LogCategory.AUTH,
          action: 'auth_callback_page_loaded',
          details: {
            url: window.location.href.split('?')[0], // don't log full URL with tokens
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
            const redirect = searchParams.get('redirect') || searchParams.get('redirect_to') || '/dashboard';
            window.location.href = redirect;
          }, 1000);
          return;
        }
        
        // Check for OAuth or legacy magic link code in URL
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
              const redirect = searchParams.get('redirect') || searchParams.get('redirect_to') || '/dashboard';
              window.location.href = redirect;
            } else {
              // If no session found after code processing, redirect to login
              console.log('No session established via route handler');
              await addLog({
                category: LogCategory.AUTH,
                action: 'auth_callback_no_session_from_route',
                details: {}
              });
              
              setError('Authentication failed. Please try logging in again.');
              setStatus('Authentication error');
              
              // Redirect to login after 3 seconds
              setTimeout(() => {
                router.push('/login?error=auth_failed');
              }, 3000);
            }
          }, 1500);
        } else {
          // No authentication data found - this is normal with OTP flow
          console.log('No authentication code found - redirecting to login');
          await addLog({
            category: LogCategory.AUTH,
            action: 'auth_callback_no_auth_data',
            details: { 
              url: window.location.pathname,
              hasQueryParams: window.location.search.length > 0
            }
          });
          
          setStatus('Redirecting to login...');
          
          // Redirect to login page
          setTimeout(() => {
            router.push('/login');
          }, 1500);
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
        
        // Redirect to login after error
        setTimeout(() => {
          router.push('/login?error=unexpected');
        }, 3000);
      }
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
            <p>{redirecting ? 'Taking you to your dashboard...' : 'Just a moment while we process your request.'}</p>
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