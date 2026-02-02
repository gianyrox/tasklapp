'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, getSession } from '../lib/api/supabase';
import { User } from '../types';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../lib/api/supabase';
import { addLog } from '../lib/logging';
import { LogCategory } from '../../confy/types';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  getCurrentSession: () => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loadingUserDataRef = useRef<boolean>(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log(`AuthContext event: ${event}`);

        try {
          setIsLoading(true);
          setError(null);

          if (session) {
            const sessionUserId = session.user.id;
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              if (currentUserIdRef.current !== sessionUserId) {
                currentUserIdRef.current = sessionUserId;
                await loadUserData(sessionUserId);
              }
            } else if (event === 'USER_UPDATED' && session.user) {
              await refreshUserDataSilently(session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            currentUserIdRef.current = null;
            setUser(null);
          }
        } catch (err) {
          console.error(`Error in AuthContext onAuthStateChange: ${err}`);
          setError('An error occurred during authentication.');
          if (event === 'SIGNED_OUT') {
            currentUserIdRef.current = null;
            setUser(null);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    if (loadingUserDataRef.current) return;

    loadingUserDataRef.current = true;
    try {
      console.log('Fetching fresh user data in AuthContext');
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setError(null);
      } else {
        console.error('getCurrentUser returned null - user profile may not exist yet');
        setError('User profile not found. Please try refreshing the page.');
        await addLog({
          userId,
          category: LogCategory.ERROR,
          action: 'user_profile_not_found',
          details: { timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to get user data');
      await addLog({
        userId,
        category: LogCategory.ERROR,
        action: 'load_user_data_error',
        details: { error: String(error) }
      });
    } finally {
      loadingUserDataRef.current = false;
    }
  };

  // Silent background refresh of user data without changing loading state
  const refreshUserDataSilently = async (userId: string) => {
    try {
      console.log('Background refresh of user data');
      const userData = await getCurrentUser();
      
      if (userData) {
        // Update state without changing loading state
        setUser(userData);
        
        await addLog({
          userId,
          category: LogCategory.DATA,
          action: 'background_refresh_success',
          details: { timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('Error in background refresh:', error);
      await addLog({
        userId,
        category: LogCategory.ERROR,
        action: 'background_refresh_failed',
        details: { error: String(error) }
      });
    }
  };

  const signIn = async (email: string) => {
    try {
      // Check if user is submitting another OTP request too quickly
      // Supabase has rate limiting, but we can add a client-side check as well
      try {
        const lastRequest = sessionStorage.getItem('last_otp_request');
        if (lastRequest) {
          const lastRequestTime = parseInt(lastRequest, 10);
          const timeSinceLastRequest = Date.now() - lastRequestTime;
          
          // If less than 30 seconds since last request, prevent spam
          if (timeSinceLastRequest < 30000) {
            const secondsToWait = Math.ceil((30000 - timeSinceLastRequest) / 1000);
            
            await addLog({
              category: LogCategory.AUTH,
              action: 'otp_rate_limited',
              details: {
                secondsSinceLastRequest: Math.floor(timeSinceLastRequest / 1000),
                secondsToWait,
                timestamp: new Date().toISOString()
              }
            });
            
            return { 
              success: false, 
              error: `Please wait ${secondsToWait} seconds before requesting another verification code.` 
            };
          }
        }
      } catch (e) {
        // If there's an error with session storage, continue
        console.error('Error accessing session storage:', e);
      }
      
      // Get the current URL to extract any redirect parameter
      const url = new URL(window.location.href);
      const redirectParam = url.searchParams.get('redirect') || '/dashboard';
      
      // Redact email for logging
      const emailPrefix = email.substring(0, email.indexOf('@'));
      const emailDomain = email.substring(email.indexOf('@') + 1);
      const redactedEmail = `${emailPrefix.substring(0, Math.min(3, emailPrefix.length))}***@${emailDomain}`;
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'sign_in_attempt',
        details: { 
          redactedEmail,
          hasRedirect: redirectParam !== '/dashboard',
          redirectPath: redirectParam === '/dashboard' ? null : redirectParam,
          method: 'otp',
          timestamp: new Date().toISOString()
        }
      });
      
      // Use Supabase's signInWithOtp to send OTP via email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Create new users automatically (can be disabled)
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message);
        
        await addLog({
          category: LogCategory.ERROR,
          action: 'sign_in_error',
          details: { 
            error: error.message,
            errorCode: error.code,
            statusCode: error.status,
            timestamp: new Date().toISOString()
          }
        });
        
        return { success: false, error: error.message };
      }
      
      // Log successful OTP sending
      await addLog({
        category: LogCategory.AUTH,
        action: 'sign_in_otp_sent',
        details: { 
          redactedEmail,
          redirectTo: redirectParam,
          timestamp: new Date().toISOString()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      
      await addLog({
        category: LogCategory.ERROR,
        action: 'sign_in_exception',
        details: { 
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const userId = user?.id;
      const startTime = Date.now();
      
      await addLog({
        userId,
        category: LogCategory.AUTH,
        action: 'sign_out_attempt',
        details: { 
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        }
      });
      
      console.log('Sign out process started');
      
      // Clear cached user data before calling signOut for better perceived performance
      try {
        console.log('Clearing session storage cache');
        if (typeof window !== 'undefined') {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('user_')) {
              sessionStorage.removeItem(key);
              console.log(`Cleared cache: ${key}`);
            }
          });
          // Record auth event immediately to prevent race conditions
          sessionStorage.setItem('last_auth_event', JSON.stringify({
            event: 'SIGNED_OUT',
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        console.error('Error clearing session storage:', e);
        
        await addLog({
          userId,
          category: LogCategory.ERROR,
          action: 'session_storage_clear_error_on_signout',
          details: { error: String(e) }
        });
      }
      
      currentUserIdRef.current = null;
      setUser(null);
      
      console.log('Executing Supabase signOut');
      const { error } = await supabase.auth.signOut();
      const endTime = Date.now();
      
      if (error) {
        throw error;
      }
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'sign_out_success',
        details: {
          duration_ms: endTime - startTime,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`Sign out completed in ${endTime - startTime}ms`);
      
      // Redirect to root page
      if (typeof window !== 'undefined') {
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
      
      await addLog({
        userId: user?.id,
        category: LogCategory.ERROR,
        action: 'sign_out_error',
        details: { 
          error: String(error),
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const getCurrentSession = async () => {
    try {
      const { data: { session } } = await getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signIn, signOut, getCurrentSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
} 