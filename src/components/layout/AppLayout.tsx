'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import buttonStyles from '../ui/Button.module.css';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.mobileMenuContainer}`) && 
          !target.closest(`.${styles.userMenu}`)) {
        setShowDropdown(false);
        setShowMobileMenu(false);
      }
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

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      console.log('Starting sign out process from UI');
      setIsSigningOut(true);
      await signOut();
      // No need to update state as we'll be redirected
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsSigningOut(false);
    }
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
          </div>
          
          {/* Desktop User Menu */}
          <div className={styles.userMenu}>
            {/* Add upgrade button for non-premium users */}
            {user?.membershipType !== 'PREMIUM' && (
              <Link 
                href="/upgrade" 
                className={`${buttonStyles.button} ${buttonStyles['variant-primary']} ${buttonStyles['size-sm']}`}
                style={{ marginRight: '1rem', textDecoration: 'none' }}
              >
                <span className={buttonStyles.leftIcon}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }}>
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className={buttonStyles.content}>Upgrade</span>
              </Link>
            )}
            
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              {user?.membershipType === 'PREMIUM' && (
                <span className={styles.premiumBadge}>Premium</span>
              )}
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
                {user?.membershipType === 'PREMIUM' && (
                  <Link 
                    href="/upgrade" 
                    className={styles.dropdownItem}
                    onClick={() => setShowDropdown(false)}
                  >
                    Manage Subscription
                  </Link>
                )}
                <button 
                  className={`${styles.dropdownItem} ${isSigningOut ? styles.signingOut : ''}`}
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Signing out...' : 'Log Out'}
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className={styles.mobileMenuContainer}>
            <div 
              className={styles.mobileMenuRow}
              onClick={handleMenuToggle}
            >
              <div className={styles.menuIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {showMobileMenu ? (
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </div>
              <div className={styles.avatar} style={{ width: '32px', height: '32px', margin: 0, boxShadow: 'none' }}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
            </div>
            
            {showMobileMenu && (
              <div className={styles.mobileMenuItems}>
                <div className={styles.mobileUserHeader}>
                  <div className={styles.avatar}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      <span>{getInitials()}</span>
                    )}
                  </div>
                  <div>
                    <div className={styles.mobileUserName}>{user?.name}</div>
                    <div className={styles.mobileUserEmail}>{user?.email}</div>
                  </div>
                </div>
                
                <ul className={`${styles.mobileNavList} ${styles.inMenu}`}>
                  <li className={styles.mobileNavItem}>
                    <Link 
                      href="/dashboard" 
                      className={`${styles.mobileNavLink} ${pathname.startsWith('/dashboard') ? styles.active : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Dashboard
                    </Link>
                  </li>
                  <li className={styles.mobileNavItem}>
                    <Link 
                      href="/friend" 
                      className={`${styles.mobileNavLink} ${pathname.startsWith('/friend') ? styles.active : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Friends
                    </Link>
                  </li>
                  <li className={styles.mobileNavItem}>
                    <Link 
                      href="/leaderboard" 
                      className={`${styles.mobileNavLink} ${pathname.startsWith('/leaderboard') ? styles.active : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 21v-5m0-6V4m8 17v-8m0-5V4M4 21v-1m0-6V4m4-2L4 4l2 2M4 10l2 2-2 2m10-10l2 2-2 2m4 6l2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Leaderboard
                    </Link>
                  </li>
                  <li className={styles.mobileNavItem}>
                    <Link 
                      href="/task" 
                      className={`${styles.mobileNavLink} ${pathname.startsWith('/task') ? styles.active : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Tasks
                    </Link>
                  </li>
                  {user?.membershipType !== 'PREMIUM' && (
                    <li className={styles.mobileNavItem}>
                      <Link 
                        href="/upgrade" 
                        className={`${styles.mobileNavLink} ${styles.upgradeLink} ${pathname.startsWith('/upgrade') ? styles.active : ''}`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Upgrade
                      </Link>
                    </li>
                  )}
                  <li className={styles.mobileNavItem}>
                    <Link 
                      href="/settings" 
                      className={`${styles.mobileNavLink} ${pathname.startsWith('/settings') ? styles.active : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Settings
                    </Link>
                  </li>
                </ul>
                
                <button 
                  className={`${styles.logoutButton} ${isSigningOut ? styles.signingOut : ''}`}
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {isSigningOut ? 'Signing out...' : 'Log Out'}
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