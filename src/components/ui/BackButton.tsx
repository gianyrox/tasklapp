'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

interface BackButtonProps {
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.back()}
      className={`back-button ${className}`}
      aria-label="Go back"
    >
      ← Back
    </button>
  );
};

export default BackButton; 