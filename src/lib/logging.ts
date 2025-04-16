import { LogCategory } from '../../confy/types';
import { supabase } from './api/supabase';

interface LogOptions {
  userId?: string;
  category: LogCategory;
  action: string;
  details?: Record<string, any>;
  context?: string;
}

/**
 * Add a log entry to the database
 */
export async function addLog(options: LogOptions): Promise<void> {
  try {
    const { userId, category, action, details, context } = options;
    
    // If no userId provided, try to get from current session
    let logUserId = userId;
    if (!logUserId) {
      const { data } = await supabase.auth.getSession();
      logUserId = data.session?.user?.id;
    }
    
    // Only log if we have a userId
    if (logUserId) {
      await supabase.from('user_logs').insert({
        user_id: logUserId,
        category,
        action,
        details,
        context
      });
    } else {
      // For system logs without user, store in local storage temporarily
      // with limits to prevent overwhelming storage
      storeLocalLog({ category, action, details, context });
    }
  } catch (error) {
    console.error('Failed to store log:', error);
    // Fallback to local storage on error
    storeLocalLog(options);
  }
}

/**
 * Store logs locally when offline or when user is not authenticated
 */
function storeLocalLog(options: Omit<LogOptions, 'userId'>): void {
  try {
    const { category, action, details, context } = options;
    const localLogs = getLocalLogs();
    
    // Add new log with timestamp
    localLogs.push({
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
      context
    });
    
    // Keep only the most recent 100 logs
    const trimmedLogs = localLogs.slice(-100);
    localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Failed to store local log:', error);
  }
}

/**
 * Get logs stored locally
 */
export function getLocalLogs(): any[] {
  try {
    const logs = localStorage.getItem('app_logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to retrieve local logs:', error);
    return [];
  }
}

/**
 * Sync local logs to the database when user authenticates
 */
export async function syncLocalLogs(userId: string): Promise<void> {
  try {
    const localLogs = getLocalLogs();
    if (localLogs.length === 0) return;
    
    // Prepare logs for batch insert
    const logsToSync = localLogs.map(log => ({
      user_id: userId,
      category: log.category,
      action: log.action,
      details: log.details,
      context: log.context,
      // Use original timestamp if available
      timestamp: log.timestamp
    }));
    
    // Insert in batches of 20 to avoid payload size limits
    const batchSize = 20;
    for (let i = 0; i < logsToSync.length; i += batchSize) {
      const batch = logsToSync.slice(i, i + batchSize);
      await supabase.from('user_logs').insert(batch);
    }
    
    // Clear local logs after successful sync
    localStorage.removeItem('app_logs');
  } catch (error) {
    console.error('Failed to sync local logs:', error);
  }
}

/**
 * Fetch user logs from the database
 */
export async function getUserLogs(
  userId: string, 
  options?: { 
    limit?: number; 
    category?: LogCategory; 
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<any[]> {
  try {
    let query = supabase
      .from('user_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    // Apply filters
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    
    if (options?.fromDate) {
      query = query.gte('timestamp', options.fromDate.toISOString());
    }
    
    if (options?.toDate) {
      query = query.lte('timestamp', options.toDate.toISOString());
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch user logs:', error);
    return [];
  }
} 