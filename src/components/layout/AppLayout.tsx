import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            Taskl
          </Link>
          <nav className={styles.nav}>
            <Link 
              href="/dashboard" 
              className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/tasks" 
              className={`${styles.navLink} ${isActive('/tasks') ? styles.active : ''}`}
            >
              My Tasks
            </Link>
            <Link 
              href="/assign" 
              className={`${styles.navLink} ${isActive('/assign') ? styles.active : ''}`}
            >
              Assign Tasks
            </Link>
            <Link 
              href="/leaderboard" 
              className={`${styles.navLink} ${isActive('/leaderboard') ? styles.active : ''}`}
            >
              Leaderboard
            </Link>
          </nav>
          <div className={styles.userMenu}>
            <div className={styles.avatar}>
              <span>JD</span>
            </div>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; {new Date().getFullYear()} Taskl.app. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout; 