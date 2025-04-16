import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import Button from '../ui/Button';
import { supabase } from '../../lib/api/supabase';

interface HeaderProps {
  isLoggedIn: boolean | null;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const router = useRouter();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  
  return (
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
              onClick={handleLogout}
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
  );
};

export default Header; 