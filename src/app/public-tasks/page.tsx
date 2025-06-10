'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PublicTask, 
  PublicTaskFilters, 
  TasklAppocationType, 
  TaskCompletionType,
  PayoutMethod 
} from '../../types';
import { getPublicTasks } from '../../lib/api/publicTasks';
import styles from './PublicTasks.module.css';
import Button from '../../components/ui/Button';
import AppLayout from '../../components/layout/AppLayout';

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPayoutMethods(methods: PayoutMethod[]) {
  return methods.map(method => {
    switch (method) {
      case PayoutMethod.CRYPTO: return 'Crypto';
      case PayoutMethod.WIRE_TRANSFER: return 'Wire Transfer';
      case PayoutMethod.VENMO: return 'Venmo';
      case PayoutMethod.ZELLE: return 'Zelle';
      case PayoutMethod.PAYPAL: return 'PayPal';
      case PayoutMethod.WESTERN_UNION: return 'Western Union';
      case PayoutMethod.MONEYGRAM: return 'MoneyGram';
      case PayoutMethod.WISE: return 'Wise';
      case PayoutMethod.REMITLY: return 'Remitly';
      case PayoutMethod.XOOM: return 'Xoom';
      default: return method;
    }
  }).join(', ');
}

function formatCompletionType(type: TaskCompletionType) {
  switch (type) {
    case TaskCompletionType.APPLICATION_BASED: return 'Application Based';
    case TaskCompletionType.PROOF_BASED: return 'Proof Based';
    default: return type;
  }
}

function formatLocationType(type: TasklAppocationType) {
  switch (type) {
    case TasklAppocationType.REMOTE: return 'Remote';
    case TasklAppocationType.ONSITE: return 'On-site';
    case TasklAppocationType.HYBRID: return 'Hybrid';
    default: return type;
  }
}

const PublicTasksPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState<PublicTaskFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [filters, currentPage]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getPublicTasks(filters, currentPage, 12);
      
      if (currentPage === 1) {
        setTasks(result.tasks);
      } else {
        setTasks(prev => [...prev, ...result.tasks]);
      }
      
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Error fetching public tasks:', err);
      setError('Failed to load public tasks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<PublicTaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/public-tasks/${taskId}`);
  };

  const handleCreateAccount = () => {
    router.push('/signup?redirect=/public-tasks');
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Public Tasks Marketplace</h1>
            <p className={styles.subtitle}>
              Discover tasks, earn money, and build your reputation
            </p>
            <div className={styles.headerActions}>
              <Button onClick={handleCreateAccount}>
                Join TasklApp.app
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {/* Search and Filters */}
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={styles.searchInput}
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
            
            <div className={styles.filterToggle}>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {(Object.keys(filters).length > 0 || searchTerm) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className={styles.filtersSection}>
              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label>Location Type</label>
                  <select
                    value={filters.locationType || ''}
                    onChange={(e) => handleFilterChange({ 
                      locationType: e.target.value as TasklAppocationType || undefined 
                    })}
                    className={styles.filterSelect}
                  >
                    <option value="">Any</option>
                    <option value={TasklAppocationType.REMOTE}>Remote</option>
                    <option value={TasklAppocationType.ONSITE}>On-site</option>
                    <option value={TasklAppocationType.HYBRID}>Hybrid</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label>Task Type</label>
                  <select
                    value={filters.completionType || ''}
                    onChange={(e) => handleFilterChange({ 
                      completionType: e.target.value as TaskCompletionType || undefined 
                    })}
                    className={styles.filterSelect}
                  >
                    <option value="">Any</option>
                    <option value={TaskCompletionType.APPLICATION_BASED}>Application Based</option>
                    <option value={TaskCompletionType.PROOF_BASED}>Proof Based</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label>Language</label>
                  <select
                    value={filters.language || ''}
                    onChange={(e) => handleFilterChange({ language: e.target.value || undefined })}
                    className={styles.filterSelect}
                  >
                    <option value="">Any</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                  </select>
                </div>
              </div>

              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label>Min Payment</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.minPayment || ''}
                    onChange={(e) => handleFilterChange({ 
                      minPayment: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className={styles.filterInput}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label>Max Payment</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    value={filters.maxPayment || ''}
                    onChange={(e) => handleFilterChange({ 
                      maxPayment: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className={styles.filterInput}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {!isLoading && (
            <div className={styles.resultsInfo}>
              <span>
                {totalCount} task{totalCount !== 1 ? 's' : ''} found
                {Object.keys(filters).length > 0 && ' (filtered)'}
              </span>
            </div>
          )}

          {/* Tasks Grid */}
          {error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <Button onClick={fetchTasks}>Try Again</Button>
            </div>
          ) : (
            <div className={styles.tasksGrid}>
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={styles.taskCard}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className={styles.taskHeader}>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    <div className={styles.paymentBadge}>
                      {formatCurrency(task.paymentAmount, task.paymentCurrency)}
                    </div>
                  </div>

                  <p className={styles.taskDescription}>{task.description}</p>

                  <div className={styles.taskMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Type:</span>
                      <span className={styles.metaValue}>
                        {formatCompletionType(task.completionType)}
                      </span>
                    </div>
                    
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Location:</span>
                      <span className={styles.metaValue}>
                        {formatLocationType(task.locationType)}
                      </span>
                    </div>

                    {task.locationCity && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>City:</span>
                        <span className={styles.metaValue}>
                          {task.locationCity}, {task.locationCountry}
                        </span>
                      </div>
                    )}

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Language:</span>
                      <span className={styles.metaValue}>{task.language}</span>
                    </div>
                  </div>

                  <div className={styles.taskFooter}>
                    <div className={styles.payoutMethods}>
                      <span className={styles.payoutLabel}>Payout via:</span>
                      <span className={styles.payoutValue}>
                        {formatPayoutMethods(task.supportedPayoutMethods)}
                      </span>
                    </div>

                    <div className={styles.taskStats}>
                      <span className={styles.stat}>
                        {task.applicationCount} applicant{task.applicationCount !== 1 ? 's' : ''}
                      </span>
                      <span className={styles.stat}>
                        {task.viewCount} view{task.viewCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {task.tags && task.tags.length > 0 && (
                    <div className={styles.tags}>
                      {task.tags.map((tag) => (
                        <span key={tag.id} className={styles.tag}>
                          {tag.tagName}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.creatorInfo}>
                    <span className={styles.creatorLabel}>Posted by:</span>
                    <span className={styles.creatorName}>{task.creator?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading States */}
          {isLoading && currentPage === 1 && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading tasks...</p>
            </div>
          )}

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className={styles.loadMoreContainer}>
              <Button onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load More Tasks'}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && tasks.length === 0 && !error && (
            <div className={styles.emptyState}>
              <h3>No tasks found</h3>
              <p>Try adjusting your search criteria or check back later for new tasks.</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PublicTasksPage; 