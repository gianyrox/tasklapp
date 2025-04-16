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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const router = useRouter();
  const loadingUserDataRef = useRef<boolean>(false);

  // Load user data - optimized to prevent redundant fetches
  const loadUserData = async (userId: string) => {
    try {
      // Use debounce to avoid multiple rapid fetches
      if (loadingUserDataRef.current) {
        console.log('User data already being loaded, skipping duplicate request');
        await addLog({
          userId,
          category: LogCategory.DATA,
          action: 'load_user_data_skipped',
          details: { reason: 'already_loading' }
        });
        return;
      }
      
      loadingUserDataRef.current = true;
      
      // Start with a small timeout to allow batching of potential multiple calls
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await addLog({
        userId,
        category: LogCategory.DATA,
        action: 'load_user_data_started',
        details: { timestamp: new Date().toISOString() }
      });
      
      // Check for cached data first
      try {
        const cachedUserData = sessionStorage.getItem(`user_${userId}`);
        const cachedTime = sessionStorage.getItem(`user_${userId}_time`);
        
        // Use cached data if it's less than 5 minutes old
        if (cachedUserData && cachedTime) {
          const cacheAge = Date.now() - parseInt(cachedTime);
          if (cacheAge < 5 * 60 * 1000) { // 5 minutes in milliseconds
            console.log('Using cached user data');
            setUser(JSON.parse(cachedUserData));
            setIsLoading(false);
            loadingUserDataRef.current = false;
            
            // Fetch fresh data in the background if cache is older than 2 minutes
            if (cacheAge > 2 * 60 * 1000) {
              setTimeout(() => {
                refreshUserDataSilently(userId);
              }, 100);
            }
            
            await addLog({
              userId,
              category: LogCategory.DATA,
              action: 'load_user_data_from_cache',
              details: { 
                cacheAge,
                cacheAgeMinutes: Math.round(cacheAge / 60000),
                timestamp: new Date().toISOString()
              }
            });
            
            return;
          }
        }
      } catch (e) {
        // If there's an error with sessionStorage, continue to fetch fresh data
        console.error('Error accessing session storage:', e);
        
        await addLog({
          userId,
          category: LogCategory.ERROR,
          action: 'session_storage_error',
          details: { error: String(e) }
        });
      }
      
      console.log('Fetching fresh user data');
      const userData = await getCurrentUser();
      
      if (userData) {
        // Cache the user data with timestamp
        try {
          sessionStorage.setItem(`user_${userId}`, JSON.stringify(userData));
          sessionStorage.setItem(`user_${userId}_time`, Date.now().toString());
        } catch (e) {
          console.error('Error caching user data:', e);
          
          await addLog({
            userId,
            category: LogCategory.ERROR,
            action: 'user_data_cache_error',
            details: { error: String(e) }
          });
        }
        
        setUser(userData);
        
        await addLog({
          userId,
          category: LogCategory.DATA,
          action: 'load_user_data_success',
          details: { 
            hasUserData: true,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        setUser(null);
        
        await addLog({
          userId,
          category: LogCategory.DATA,
          action: 'load_user_data_empty',
          details: { 
            hasUserData: false,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to get user data');
      setUser(null);
      
      await addLog({
        userId,
        category: LogCategory.ERROR,
        action: 'load_user_data_failed',
        details: { 
          error: String(error),
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsLoading(false);
      loadingUserDataRef.current = false;
    }
  };

  // Silent background refresh of user data without changing loading state
  const refreshUserDataSilently = async (userId: string) => {
    try {
      console.log('Background refresh of user data');
      const userData = await getCurrentUser();
      
      if (userData) {
        // Update cache
        try {
          sessionStorage.setItem(`user_${userId}`, JSON.stringify(userData));
          sessionStorage.setItem(`user_${userId}_time`, Date.now().toString());
        } catch (e) {
          console.error('Error updating user data cache:', e);
        }
        
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

  useEffect(() => {
    const checkUser = async () => {
      if (isAuthChecked) return;
      
      setIsLoading(true);
      try {
        // Check if user is authenticated
        await addLog({
          category: LogCategory.AUTH,
          action: 'auth_check_started',
          details: { 
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
        
        // Use a small timeout to allow React to render loading state first
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Use optimized getSession
        const { data: { session } } = await getSession();
        
        if (session) {
          setIsAuthChecked(true);
          
          await addLog({
            userId: session.user.id,
            category: LogCategory.AUTH,
            action: 'session_detected',
            details: { 
              provider: session.user.app_metadata?.provider,
              expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
              url: window.location.pathname,
              hasCookies: document.cookie.includes('supabase-auth'),
              timestamp: new Date().toISOString()
            }
          });
          
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
          
          await addLog({
            category: LogCategory.AUTH,
            action: 'no_session_detected',
            details: { 
              url: window.location.pathname,
              hasCookies: document.cookie.includes('supabase-auth'),
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setError('Failed to get user data');
        setUser(null);
        setIsLoading(false);
        
        await addLog({
          category: LogCategory.ERROR,
          action: 'auth_check_failed',
          details: { 
            error: String(error),
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    // Check user on mount
    checkUser();

    // Listen for auth changes with optimizations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only log events that actually change the auth state
      const importantEvents = ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED'];
      
      if (importantEvents.includes(event)) {
        await addLog({
          userId: session?.user?.id,
          category: LogCategory.AUTH,
          action: 'auth_state_change',
          details: { 
            event,
            provider: session?.user?.app_metadata?.provider,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Update session cache in supabase module
      if (session) {
        // Instead of accessing window.sessionCache directly, we'll handle this in the API module
        try {
          // Refresh the session cache for future API calls
          if (typeof window !== 'undefined') {
            // Update session storage to ensure cache coherence
            sessionStorage.setItem('last_auth_event', JSON.stringify({
              event,
              timestamp: Date.now()
            }));
          }
        } catch (e) {
          console.error('Error updating session cache:', e);
        }
      }
      
      if (event === 'SIGNED_IN' && session) {
        await loadUserData(session.user.id);
        
        await addLog({
          userId: session.user.id,
          category: LogCategory.AUTH,
          action: 'signed_in',
          details: { 
            provider: session.user.app_metadata?.provider,
            event,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        
        // Clear session storage on sign out
        try {
          if (typeof window !== 'undefined') {
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('user_')) {
                sessionStorage.removeItem(key);
              }
            });
          }
        } catch (e) {
          console.error('Error clearing session storage:', e);
        }
        
        await addLog({
          category: LogCategory.AUTH,
          action: 'signed_out',
          details: { 
            event,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthChecked]);

  const signIn = async (email: string) => {
    try {
      // Check if user is submitting another magic link request too quickly
      // Supabase has rate limiting, but we can add a client-side check as well
      try {
        const lastRequest = sessionStorage.getItem('last_magic_link_request');
        if (lastRequest) {
          const lastRequestTime = parseInt(lastRequest, 10);
          const timeSinceLastRequest = Date.now() - lastRequestTime;
          
          // If less than 30 seconds since last request, prevent spam
          if (timeSinceLastRequest < 30000) {
            const secondsToWait = Math.ceil((30000 - timeSinceLastRequest) / 1000);
            
            await addLog({
              category: LogCategory.AUTH,
              action: 'magic_link_rate_limited',
              details: {
                secondsSinceLastRequest: Math.floor(timeSinceLastRequest / 1000),
                secondsToWait,
                timestamp: new Date().toISOString()
              }
            });
            
            return { 
              success: false, 
              error: `Please wait ${secondsToWait} seconds before requesting another magic link.` 
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
          method: 'magic_link',
          timestamp: new Date().toISOString()
        }
      });
      
      // Build the callback URL with redirect parameter
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect_to', redirectParam);
      
      // Record callback URL for debugging
      await addLog({
        category: LogCategory.AUTH,
        action: 'sign_in_callback_url',
        details: { 
          callbackUrl: callbackUrl.toString().replace(email, redactedEmail),
          timestamp: new Date().toISOString()
        }
      });
      
      // Use Supabase's signInWithOtp to send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Create new users automatically (can be disabled)
          shouldCreateUser: true,
          emailRedirectTo: callbackUrl.toString(),
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
      
      // Log successful magic link sending
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
      
      await addLog({
        userId,
        category: LogCategory.AUTH,
        action: 'sign_out_attempt'
      });
      
      await supabase.auth.signOut();
      setUser(null);
      
      // Clear cached user data
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('user_')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error('Error clearing session storage:', e);
        
        await addLog({
          category: LogCategory.ERROR,
          action: 'session_storage_clear_error_on_signout',
          details: { error: String(e) }
        });
      }
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'sign_out_success'
      });
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
      
      await addLog({
        userId: user?.id,
        category: LogCategory.ERROR,
        action: 'sign_out_error',
        details: { error: String(error) }
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signIn, signOut }}>
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