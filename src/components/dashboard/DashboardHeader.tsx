import React from 'react';
import styles from './DashboardHeader.module.css';
import { User } from '../../types';

interface DashboardHeaderProps {
  user: User | null;
  isLoading: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, isLoading }) => {
  if (isLoading) return <div className={styles.header}><h1>Loading...</h1></div>;
  
  return (
    <header className={styles.header}>
      <p className={styles.welcomeMessage}>
        Welcome back, <span className={styles.userName}>{user?.name || 'User'}</span>
      </p>
      <h1>Your Dashboard</h1>
    </header>
  );
};

export default DashboardHeader; 