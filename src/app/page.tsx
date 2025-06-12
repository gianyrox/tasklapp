"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Home.module.css";
import Button from "../components/ui/Button";
import { supabase } from "../lib/api/supabase";
import RaceTrackVisualization from "./RaceTrack";
import AuthProfile from "../components/layout/AuthProfile";

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingAuth, setProcessingAuth] = useState(false);

  useEffect(() => {
    // This effect consolidates all authentication logic to prevent race conditions
    // and ensure loading states are handled correctly.

    let isMounted = true;

    // 1. Unified Authentication Check
    const checkAuthentication = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setProcessingAuth(true);

      try {
        // First, attempt to process auth tokens from the URL hash
        // This is for handling redirects from OAuth or magic links
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            console.log("Setting session from URL hash tokens");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session from URL:", error);
            } else if (data.session) {
              console.log("Successfully set session from URL");
              // The onAuthStateChange listener below will handle the state update
            }
            
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        
        // 2. Initial Session Check (if no hash was processed)
        // This is for returning users who already have a session cookie.
        // We let the onAuthStateChange listener handle the result of this.
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setIsLoggedIn(!!session);
          setUserId(session?.user?.id || null);
        }

      } catch (error) {
        console.error("Error during initial auth check:", error);
        if (isMounted) {
          setIsLoggedIn(false);
          setUserId(null);
        }
      } finally {
        if (isMounted) {
          setProcessingAuth(false);
          setIsLoading(false);
        }
      }
    };

    // 3. Auth State Change Listener
    // This is the single source of truth for auth state changes.
    // It fires on mount with the initial session AND on any subsequent auth event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          console.log("Auth state changed:", event, session);
          setIsLoggedIn(!!session);
          setUserId(session?.user.id || null);
          
          // Ensure loading is always false after the listener has processed an event.
          setIsLoading(false);
          setProcessingAuth(false);
        }
      }
    );

    // Run the initial check
    checkAuthentication();

    // 4. Cleanup Logic
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Tasklapp</div>
        <AuthProfile />
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <span>{processingAuth ? "Processing authentication..." : "Loading..."}</span>
          </div>
        ) : (
          <>
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
                <h1 className={styles.title}>
                  Complete Tasks. <br />
                  Do Laps. <br />
                  Compete.
                </h1>
                <p className={styles.subtitle}>
                  TasklApp.app transforms ordinary task management into a competitive
                  experience. Assign tasks, track performance, and race to the top
                  of the leaderboard.
                </p>
                <div className={styles.cta}>
                  {isLoggedIn ? (
                    <Link href="/dashboard" className={styles.buttonLink}>
                      <Button size="lg" variant="primary" className={styles.button}>
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup" className={styles.buttonLink}>
                        <Button
                          size="lg"
                          variant="primary"
                          className={styles.button}
                        >
                          Start Racing
                        </Button>
                      </Link>
                      <Link href="/login" className={styles.buttonLink}>
                        <Button
                          size="lg"
                          variant="outline"
                          className={styles.button}
                        >
                          Log In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.heroImage}>
                <RaceTrackVisualization />
              </div>
            </section>


            <section className={styles.features}>
              <h2 className={styles.sectionTitle}>Key Features</h2>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div
                    className={styles.featureIcon}
                    style={{ backgroundColor: "var(--primary)" }}
                  ></div>
                  <h3>Competitive Task Assignment</h3>
                  <p>
                    Create challenges and assign tasks to team members with
                    customizable difficulty levels.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div
                    className={styles.featureIcon}
                    style={{ backgroundColor: "var(--secondary)" }}
                  ></div>
                  <h3>Real-time Performance Tracking</h3>
                  <p>
                    Monitor completion rates, speed, and consistency with our
                    racing-inspired dashboard.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div
                    className={styles.featureIcon}
                    style={{ backgroundColor: "var(--success)" }}
                  ></div>
                  <h3>Leaderboard Rankings</h3>
                  <p>
                    Foster healthy competition with performance-based rankings and
                    achievement badges.
                  </p>
                </div>
                <div className={styles.featureCard}>
                  <div
                    className={styles.featureIcon}
                    style={{ backgroundColor: "var(--info)" }}
                  ></div>
                  <h3>Racing Analytics</h3>
                  <p>
                    Gain insights with comprehensive statistics and visualize your
                    productivity journey.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>
            &copy; {new Date().getFullYear()} TasklApp.app. All rights reserved.
          </p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="mailto:hello@TasklApp.app">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
