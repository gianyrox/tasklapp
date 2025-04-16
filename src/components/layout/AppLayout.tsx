'use client';

import React, { ReactNode, useState, useEffect } from 'react';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
      setShowMobileMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showMobileMenu]);
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return 'U';
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMobileMenu(!showMobileMenu);
  };
  
  const handleUserMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <Link href="/dashboard" className={styles.logo}>
              Taskl
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
            
            <button 
              className={styles.mobileMenuButton} 
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {showMobileMenu ? (
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </button>
          </div>
          
          <div className={styles.userMenu}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
            </div>
            <div 
              className={styles.avatar} 
              onClick={handleUserMenuToggle}
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
      
      {/* Mobile Navigation */}
      <div className={`${styles.mobileNavigation} ${showMobileMenu ? styles.active : ''}`}>
        <ul className={styles.mobileNavList}>
          <li className={styles.mobileNavItem}>
            <Link 
              href="/dashboard" 
              className={`${styles.mobileNavLink} ${pathname.startsWith('/dashboard') ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Dashboard
            </Link>
          </li>
          <li className={styles.mobileNavItem}>
            <Link 
              href="/friend" 
              className={`${styles.mobileNavLink} ${pathname.startsWith('/friend') ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Friends
            </Link>
          </li>
          <li className={styles.mobileNavItem}>
            <Link 
              href="/leaderboard" 
              className={`${styles.mobileNavLink} ${pathname.startsWith('/leaderboard') ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Leaderboard
            </Link>
          </li>
          <li className={styles.mobileNavItem}>
            <Link 
              href="/task" 
              className={`${styles.mobileNavLink} ${pathname.startsWith('/task') ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Tasks
            </Link>
          </li>
          <li className={styles.mobileNavItem}>
            <Link 
              href="/settings" 
              className={`${styles.mobileNavLink} ${pathname.startsWith('/settings') ? styles.active : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Settings
            </Link>
          </li>
        </ul>
      </div>
      
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