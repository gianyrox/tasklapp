import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import Button from '../ui/Button';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  showDetails?: boolean;
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
  showDetails = false
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
    <div className={`${styles.taskCard} ${priorityClass}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{task.title}</h3>
        <span className={`${styles.status} ${statusClass}`}>
          {task.status}
        </span>
      </div>
      
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
      
      {showDetails && (
        <div className={styles.description}>
          <p>{task.description}</p>
        </div>
      )}
      
      <div className={styles.actions}>
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
    </div>
  );
};

export default TaskCard; 