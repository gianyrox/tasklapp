'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Home.module.css';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Taskl</div>
        <nav className={styles.nav}>
          <Link href="/login" className={styles.navLink}>
            Login
          </Link>
          <Link href="/signup" className={styles.signupButton}>
            <Button variant="primary">Sign Up</Button>
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Complete Tasks. Do Laps. Compete.</h1>
            <p className={styles.subtitle}>
              A competitive task management platform where you can assign tasks, track performance, and rise through the ranks.
            </p>
            <div className={styles.cta}>
              <Link href="/signup">
                <Button size="lg" variant="primary">Get Started</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">View Demo</Button>
              </Link>
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