'use client';

import { useState, useEffect } from 'react';
import { useLogging } from '../context/LoggingContext';
import { LogCategory } from '../../confy/types';

interface LogViewerProps {
  initialLimit?: number;
  showFilters?: boolean;
}

export default function LogViewer({ initialLimit = 20, showFilters = true }: LogViewerProps) {
  const { getHistory } = useLogging();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | ''>('');
  const [limit, setLimit] = useState(initialLimit);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  // Load logs on component mount and when filters change
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const options: any = { limit };
        
        if (selectedCategory) {
          options.category = selectedCategory;
        }
        
        if (dateRange.from) {
          options.fromDate = new Date(dateRange.from);
        }
        
        if (dateRange.to) {
          options.toDate = new Date(dateRange.to);
        }
        
        const data = await getHistory(options);
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [getHistory, limit, selectedCategory, dateRange]);
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value as LogCategory | '');
  };
  
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
  };
  
  const handleDateChange = (type: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Get color for log category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AUTH':
        return '#4a9eff';
      case 'DATA':
        return '#65c565';
      case 'TASK':
        return '#ffa726';
      case 'FRIEND':
        return '#ab47bc';
      case 'ERROR':
        return '#ef5350';
      case 'SYSTEM':
        return '#78909c';
      default:
        return '#78909c';
    }
  };

  return (
    <div className="log-viewer">
      {showFilters && (
        <div className="log-filters">
          <div className="filter-group">
            <label htmlFor="category-filter">Category:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="category-select"
            >
              <option value="">All Categories</option>
              {Object.values(LogCategory).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="limit-filter">Show:</label>
            <select
              id="limit-filter"
              value={limit}
              onChange={handleLimitChange}
              className="limit-select"
            >
              <option value={10}>10 entries</option>
              <option value={20}>20 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="date-from">From:</label>
            <input
              type="date"
              id="date-from"
              value={dateRange.from || ''}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="date-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="date-to">To:</label>
            <input
              type="date"
              id="date-to"
              value={dateRange.to || ''}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="no-logs">No logs found</div>
      ) : (
        <div className="logs-container">
          {logs.map(log => (
            <div key={log.id} className="log-entry">
              <div className="log-header">
                <span 
                  className="log-category"
                  style={{ backgroundColor: getCategoryColor(log.category) }}
                >
                  {log.category}
                </span>
                <span className="log-timestamp">
                  {formatDate(log.timestamp)}
                </span>
              </div>
              
              <div className="log-action">{log.action}</div>
              
              {log.context && (
                <div className="log-context">{log.context}</div>
              )}
              
              {log.details && (
                <pre className="log-details">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .log-viewer {
          width: 100%;
          font-family: sans-serif;
        }
        
        .log-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .filter-group label {
          font-size: 14px;
          font-weight: 500;
          color: #555;
        }
        
        .category-select,
        .limit-select,
        .date-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }
        
        .logs-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .log-entry {
          padding: 16px;
          border-radius: 8px;
          background-color: #f9f9f9;
          border-left: 4px solid #ddd;
        }
        
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .log-category {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .log-timestamp {
          font-size: 12px;
          color: #777;
        }
        
        .log-action {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .log-context {
          font-size: 14px;
          margin-bottom: 8px;
          color: #666;
        }
        
        .log-details {
          font-family: monospace;
          font-size: 13px;
          background-color: #f0f0f0;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .loading,
        .no-logs {
          padding: 20px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
} 