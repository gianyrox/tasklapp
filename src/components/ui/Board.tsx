import React, { ReactNode } from 'react';
import styles from './Board.module.css';

interface BoardProps {
  title: string;
  children: ReactNode;
  actionButton?: ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const Board: React.FC<BoardProps> = ({ 
  title, 
  children, 
  actionButton, 
  emptyState, 
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`${styles.board} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {actionButton && (
          <div className={styles.action}>
            {actionButton}
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading...</p>
          </div>
        ) : React.Children.count(children) > 0 ? (
          children
        ) : (
          emptyState || (
            <div className={styles.emptyState}>
              <p>No items to display</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Board; 