'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import styles from './BackButton.module.css';

interface BackButtonProps {
  className?: string;
  route?: string; // Optional specific route to navigate to
}

const BackButton: React.FC<BackButtonProps> = ({ className = '', route }) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (route) {
      router.push(route);
    } else {
      router.back();
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`back-button ${className}`}
      aria-label="Go back"
    >
      ← Back
    </button>
  );
};

export default BackButton; 