'use client';

import { createContext, useContext, useCallback, useEffect } from 'react';
import { addLog, syncLocalLogs, getUserLogs } from '../lib/logging';
import { LogCategory } from '../../confy/types';
import { useAuth } from './AuthContext';

type LogFunction = (options: {
  action: string;
  category: LogCategory;
  details?: Record<string, any>;
  context?: string;
}) => Promise<void>;

type LoggingContextType = {
  log: LogFunction;
  getHistory: (options?: {
    limit?: number;
    category?: LogCategory;
    fromDate?: Date;
    toDate?: Date;
  }) => Promise<any[]>;
};

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);

export function LoggingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Sync local logs when user signs in
  useEffect(() => {
    if (user?.id) {
      syncLocalLogs(user.id).catch(error => {
        console.error('Failed to sync local logs:', error);
      });
    }
  }, [user?.id]);
  
  // Log function that automatically includes userId from auth context
  const log: LogFunction = useCallback(
    async ({ action, category, details, context }) => {
      try {
        await addLog({
          userId: user?.id,
          action,
          category,
          details,
          context,
        });
      } catch (error) {
        console.error('Error logging action:', error);
      }
    },
    [user?.id]
  );
  
  // Get user log history
  const getHistory = useCallback(
    async (options?: {
      limit?: number;
      category?: LogCategory;
      fromDate?: Date;
      toDate?: Date;
    }) => {
      if (!user?.id) return [];
      return getUserLogs(user.id, options);
    },
    [user?.id]
  );
  
  return (
    <LoggingContext.Provider value={{ log, getHistory }}>
      {children}
    </LoggingContext.Provider>
  );
}

export function useLogging() {
  const context = useContext(LoggingContext);
  
  if (context === undefined) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  
  return context;
} 