'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import LogViewer from '../../../components/LogViewer';

export default function ActivityHistoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && isClient) {
      router.push('/login');
    }
  }, [user, isLoading, router, isClient]);
  
  // Show loading state or login redirect for SSR
  if (!isClient || isLoading || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="activity-history-page">
      <header className="page-header">
        <h1>Activity History</h1>
        <p>View your recent activity and system events</p>
      </header>
      
      <div className="content-container">
        <LogViewer initialLimit={50} showFilters={true} />
      </div>
      
      <style jsx>{`
        .activity-history-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .page-header h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .page-header p {
          color: #666;
          font-size: 16px;
        }
        
        .content-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 