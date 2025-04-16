'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return 'U';
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/dashboard" className={styles.logo}>
            Taskl
          </Link>
          <Link href="/friend" className={styles.friendLink}>
            Friends
          </Link>
          <Link href="/leaderboard" className={styles.leaderboardLink}>
            Leaderboard
          </Link>
          <div className={styles.userMenu}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
            </div>
            <div 
              className={styles.avatar} 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            
            {showDropdown && (
              <div className={styles.dropdown}>
                <Link 
                  href="/settings" 
                  className={styles.dropdownItem}
                  onClick={() => setShowDropdown(false)}
                >
                  Settings
                </Link>
                <button 
                  className={styles.dropdownItem} 
                  onClick={() => {
                    signOut();
                    setShowDropdown(false);
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
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