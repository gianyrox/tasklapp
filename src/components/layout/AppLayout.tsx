'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './AppLayout.module.css';
import AuthProfile from './AuthProfile';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Debug logging
  console.log('🔍 AppLayout Debug:', {
    user: user,
    membershipType: user?.membershipType,
    isMEMBER: user?.membershipType === 'MEMBER',
    userKeys: user ? Object.keys(user) : 'No user'
  });

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <Link href="/dashboard" className={styles.logo}>
              Tasklapp
            </Link>
            
            <nav className={styles.navigation}>
              <ul className={styles.navList}>
                <li className={styles.navItem}>
                  <Link 
                    href="/dashboard" 
                    className={`${styles.navLink} ${pathname.startsWith('/dashboard') ? styles.active : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <Link 
                    href="/friend" 
                    className={`${styles.navLink} ${pathname.startsWith('/friend') ? styles.active : ''}`}
                  >
                    Friends
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <Link 
                    href="/leaderboard" 
                    className={`${styles.navLink} ${pathname.startsWith('/leaderboard') ? styles.active : ''}`}
                  >
                    Leaderboard
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <Link 
                    href="/task" 
                    className={`${styles.navLink} ${pathname.startsWith('/task') ? styles.active : ''}`}
                  >
                    Tasks
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Use AuthProfile component */}
          <AuthProfile />
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; {new Date().getFullYear()} TasklApp.app. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout; 