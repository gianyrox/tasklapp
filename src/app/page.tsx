"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Home.module.css";
import Button from "../components/ui/Button";
import { supabase } from "../lib/api/supabase";
import RaceTrackVisualization from "./RaceTrack";

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingAuth, setProcessingAuth] = useState(false);

  useEffect(() => {
    // Process auth token from URL hash immediately if present
    const processAuthToken = async () => {
      if (typeof window !== "undefined" && window.location.hash) {
        try {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );

          if (hashParams.get("access_token")) {
            setProcessingAuth(true);
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
              console.log("Setting session from URL hash tokens");
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error("Error setting session:", error);
              } else if (data?.session) {
                console.log("Successfully set session");
                // Clear the URL hash to avoid sharing tokens
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
                // Update state before redirecting
                setIsLoggedIn(true);
                setUserId(data.session.user.id);
                // No longer auto-redirecting to dashboard
              }
            }
            setProcessingAuth(false);
            return true; // Token processed successfully
          }
        } catch (e) {
          console.error("Error processing auth token:", e);
          setProcessingAuth(false);
        }
      }
      return false; // No token or failed to process
    };

    // Set up auth listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setIsLoggedIn(!!session);
        setUserId(session?.user.id || null);
        setIsLoading(false);

        // Don't auto-redirect to dashboard on sign in
      }
    );

    // Initial check for session
    const checkAuth = async () => {
      setIsLoading(true);
      const tokenProcessed = await processAuthToken();
      if (!tokenProcessed) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        setUserId(session?.user.id || null);
        setIsLoading(false);
      }
    };

    checkAuth();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>TaskLap</div>
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
                  Taskl.app transforms ordinary task management into a competitive
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
            &copy; {new Date().getFullYear()} Taskl.app. All rights reserved.
          </p>
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
