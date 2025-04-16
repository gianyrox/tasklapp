import React from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';
import Button from '../ui/Button';

interface HeroSectionProps {
  isLoggedIn: boolean | null;
  userId: string | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn, userId }) => {
  return (
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
          <h1 className={styles.title}>Complete Tasks. Do Laps. Compete.</h1>
          <p className={styles.subtitle}>
            Taskl.app transforms ordinary task management into a competitive experience. 
            Assign tasks, track performance, and race to the top of the leaderboard.
          </p>
          <div className={styles.cta}>
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" variant="primary">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" variant="primary">Start Racing</Button>
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
          <div className={styles.trackImage}></div>
        </div>
      </section>
    </>
  );
};

export default HeroSection; 