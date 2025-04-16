import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import Button from '../ui/Button';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  showDetails?: boolean;
  ownership?: 'self' | 'friend';
  compact?: boolean;
}

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getStatusClassName = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return 'status-pending';
    case TaskStatus.IN_PROGRESS:
      return 'status-in-progress';
    case TaskStatus.COMPLETED:
      return 'status-completed';
    case TaskStatus.OVERDUE:
      return 'status-overdue';
    default:
      return '';
  }
};

export const getPriorityClassName = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return 'priority-low';
    case TaskPriority.MEDIUM:
      return 'priority-medium';
    case TaskPriority.HIGH:
      return 'priority-high';
    case TaskPriority.URGENT:
      return 'priority-urgent';
    default:
      return '';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  showDetails = false,
  ownership = 'self',
  compact = false
}) => {
  const statusClass = getStatusClassName(task.status);
  const priorityClass = getPriorityClassName(task.priority);
  
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };
  
  const isOverdue = task.dueDate < new Date() && task.status !== TaskStatus.COMPLETED;
  
  return (
    <div className={`${styles.taskCard} ${priorityClass} ${styles[`ownership-${ownership}`]} ${compact ? styles.compactCard : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {task.title}
          {!compact && ownership === 'self' && <span className={styles.ownershipBadge}>My Task</span>}
          {!compact && ownership === 'friend' && <span className={styles.ownershipBadge}>Friend's Task</span>}
        </h3>
        <span className={`${styles.status} ${statusClass}`}>
          {task.status}
        </span>
      </div>
      
      {!compact && task.assigner && (
        <div className={styles.assignerInfo}>
          <div className={styles.assignerAvatar}>
            {task.assigner.avatarUrl ? (
              <img src={task.assigner.avatarUrl} alt={`${task.assigner.name}'s avatar`} />
            ) : (
              <div className={styles.assignerInitials}>
                {task.assigner.name.charAt(0)}
              </div>
            )}
          </div>
          <div className={styles.assignerName}>
            Assigned by <span>{task.assigner.name}</span>
          </div>
        </div>
      )}
      
      {!compact && (
        <div className={styles.dates}>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Created:</span>
            <span>{formatDate(task.createdAt)}</span>
          </div>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Due:</span>
            <span className={isOverdue ? styles.overdue : ''}>
              {formatDate(task.dueDate)}
            </span>
          </div>
        </div>
      )}
      
      {compact && (
        <div className={styles.compactDueDate}>
          Due: <span className={isOverdue ? styles.overdue : ''}>{formatDate(task.dueDate)}</span>
        </div>
      )}
      
      {showDetails && !compact && (
        <div className={styles.description}>
          <p>{task.description}</p>
        </div>
      )}
      
      {!compact && (
        <div className={styles.actions}>
          {ownership === 'self' && (
            <>
              {task.status === TaskStatus.PENDING && (
                <Button 
                  size="sm" 
                  variant="info" 
                  onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                >
                  Start Task
                </Button>
              )}
              
              {task.status === TaskStatus.IN_PROGRESS && (
                <Button 
                  size="sm" 
                  variant="success" 
                  onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                >
                  Complete
                </Button>
              )}
            </>
          )}
          
          {ownership === 'friend' && (
            <Button 
              size="sm" 
              variant="primary"
              className={styles.detailsButton}
            >
              View Progress
            </Button>
          )}
          
          {!showDetails && (
            <Button 
              size="sm" 
              variant="outline"
              className={styles.detailsButton}
            >
              View Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard; 