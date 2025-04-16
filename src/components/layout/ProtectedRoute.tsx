'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './ProtectedRoute.module.css';
import { addLog } from '../../lib/logging';
import { LogCategory } from '../../../confy/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Add detailed logging for auth protection
    const checkAuthStatus = async () => {
      if (isLoading) return;

      // Log the current status
      await addLog({
        category: LogCategory.AUTH,
        action: 'protected_route_check',
        details: {
          path: pathname,
          isAuthenticated: Boolean(user),
          cookiesPresent: document.cookie.length > 0,
          timestamp: new Date().toISOString()
        }
      });

      // If authentication check is complete and user is not authenticated
      if (!user && !redirecting) {
        console.log('User not authenticated for protected route', {
          path: pathname,
          cookies: document.cookie ? 'present' : 'missing'
        });

        setRedirecting(true);
        
        // If we detect an issue with cookies, clear localStorage and reload
        if (localStorage.getItem('supabase.auth.token') && !document.cookie.includes('supabase-auth')) {
          console.log('Auth token in localStorage but no cookie - clearing storage');
          
          await addLog({
            category: LogCategory.ERROR,
            action: 'cookie_sync_issue_detected',
            details: { path: pathname }
          });
          
          // Clear any Supabase related items in localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.')) {
              localStorage.removeItem(key);
            }
          });
          
          // Redirect to login with clean state
          window.location.href = `/login?redirect=${encodeURIComponent(pathname)}&refresh=true`;
          return;
        }

        // Standard redirect to login
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    };

    checkAuthStatus();
  }, [user, isLoading, router, pathname, redirecting]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinnerWrapper}>
          <div className={styles.loadingSpinner}></div>
        </div>
        <p className={styles.loadingText}>Loading your account...</p>
      </div>
    );
  }

  // If auth error, show error message and link to login
  if (error && !user) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h3>Authentication Error</h3>
          <p>{error}</p>
          <button 
            className={styles.loginButton}
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (user) {
    return <>{children}</>;
  }

  // Render nothing while redirecting
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinnerWrapper}>
        <div className={styles.loadingSpinner}></div>
      </div>
      <p className={styles.loadingText}>Redirecting to login...</p>
    </div>
  );
};

export default ProtectedRoute; 