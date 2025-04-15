'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Home.module.css';
import Button from '../components/ui/Button';
import { supabase } from '../lib/api/supabase';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth session check:", session ? "Session found" : "No session");
      setIsLoggedIn(!!session);
      setUserId(session?.user.id || null);
    };
    
    checkAuth();

    // Check if URL contains Supabase auth tokens (in hash fragment)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1) // remove the # character
      );
      
      if (hashParams.get('access_token')) {
        // Process the auth data from hash fragments
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');
        const tokenType = hashParams.get('token_type');
        
        if (accessToken && refreshToken && expiresIn && tokenType) {
          // Set the session in Supabase
          (async () => {
            console.log("Setting session from URL hash tokens");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else if (data?.session) {
              console.log("Successfully set session, redirecting to dashboard");
              setIsLoggedIn(true);
              setUserId(data.session.user.id);
              // Clear the URL hash to avoid sharing tokens
              window.history.replaceState({}, document.title, window.location.pathname);
              // Redirect to dashboard
              router.push('/dashboard');
            }
          })();
        }
      }
    }
  }, [router]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Taskl</div>
        <nav className={styles.nav}>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              <button 
                className={styles.navLink}
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
                  router.refresh();
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>
                Login
              </Link>
              <Link href="/signup" className={styles.signupButton}>
                <Button variant="primary">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        {isLoggedIn && (
          <div className={styles.authStatus}>
            <p>✅ You are logged in! User ID: {userId}</p>
            <Link href="/dashboard">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
          </div>
        )}
        
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Complete Tasks. Do Laps. Compete.</h1>
            <p className={styles.subtitle}>
              A competitive task management platform where you can assign tasks, track performance, and rise through the ranks.
            </p>
            <div className={styles.cta}>
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" variant="primary">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg" variant="primary">Get Started</Button>
                </Link>
              )}
              {!isLoggedIn && (
                <Link href="/login">
                  <Button size="lg" variant="outline">Log In</Button>
                </Link>
              )}
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.imagePlaceholder}></div>
          </div>
        </section>

        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Key Features</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ backgroundColor: 'var(--primary)' }}></div>
              <h3>Task Assignment</h3>
              <p>Assign tasks to team members and track their progress in real-time.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ backgroundColor: 'var(--secondary)' }}></div>
              <h3>Performance Tracking</h3>
              <p>Monitor completion rates, speed, and consistency across your team.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ backgroundColor: 'var(--success)' }}></div>
              <h3>Competitive Rankings</h3>
              <p>Foster healthy competition with performance-based leaderboards.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ backgroundColor: 'var(--info)' }}></div>
              <h3>Detailed Analytics</h3>
              <p>Access comprehensive statistics to improve productivity.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; {new Date().getFullYear()} Taskl.app. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 