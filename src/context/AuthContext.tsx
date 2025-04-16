'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/api/supabase';
import { User } from '../types';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../lib/api/supabase';

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
        return;
      }
      
      loadingUserDataRef.current = true;
      
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
            return;
          }
        }
      } catch (e) {
        // If there's an error with sessionStorage, continue to fetch fresh data
        console.error('Error accessing session storage:', e);
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
        }
        
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to get user data');
      setUser(null);
    } finally {
      setIsLoading(false);
      loadingUserDataRef.current = false;
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      if (isAuthChecked) return;
      
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsAuthChecked(true);
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setError('Failed to get user data');
        setUser(null);
        setIsLoading(false);
      }
    };

    // Check user on mount
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Clear cached user data on sign out
        try {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('user_')) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error('Error clearing session storage:', e);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthChecked]);

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
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
      }
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
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