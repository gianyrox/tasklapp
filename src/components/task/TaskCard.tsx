import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, SubmissionType } from '../../types';
import Button from '../ui/Button';
import styles from './TaskCard.module.css';
import { useRouter } from 'next/navigation';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onSubmissionTypeChange?: (taskId: string, newType: SubmissionType) => void;
  onSubmissionContentChange?: (taskId: string, content: string) => void;
  showDetails?: boolean;
  ownership?: 'self' | 'friend';
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
    case TaskStatus.GRADED:
      return 'status-graded';
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
  onSubmissionTypeChange,
  onSubmissionContentChange,
  showDetails = false,
  ownership = 'self'
}) => {
  const router = useRouter();
  const [isEditingSubmissionType, setIsEditingSubmissionType] = useState(false);
  const [isEditingSubmissionContent, setIsEditingSubmissionContent] = useState(false);
  const [submissionContent, setSubmissionContent] = useState(task.submissionContent || '');
  const [isSubmittingSave, setIsSubmittingSave] = useState(false);
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const statusClass = getStatusClassName(task.status);
  const priorityClass = getPriorityClassName(task.priority);
  
  // Update submission content if task changes
  useEffect(() => {
    setSubmissionContent(task.submissionContent || '');
  }, [task.submissionContent]);
  
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };
  
  const handleSubmissionTypeChange = (newType: SubmissionType) => {
    if (onSubmissionTypeChange) {
      onSubmissionTypeChange(task.id, newType);
      setIsEditingSubmissionType(false);
    }
  };
  
  const handleSaveSubmission = async () => {
    if (onSubmissionContentChange && submissionContent.trim()) {
      setIsSubmittingSave(true);
      try {
        await onSubmissionContentChange(task.id, submissionContent);
        setIsEditingSubmissionContent(false);
      } finally {
        setIsSubmittingSave(false);
      }
    }
  };
  
  const handleSubmitAndComplete = async () => {
    if (!onSubmissionContentChange || !onStatusChange) return;
    
    setIsSubmittingComplete(true);
    try {
      // First save submission content
      if (submissionContent.trim()) {
        await onSubmissionContentChange(task.id, submissionContent);
      }
      
      // Then mark as completed
      await onStatusChange(task.id, TaskStatus.COMPLETED);
      setIsEditingSubmissionContent(false);
    } finally {
      setIsSubmittingComplete(false);
    }
  };
  
  const handleViewTaskDetails = () => {
    router.push(`/task/${task.id}`);
  };
  
  const isOverdue = task.dueDate < new Date() && task.status !== TaskStatus.COMPLETED;
  
  return (
    <div className={`${styles.taskCard} ${priorityClass} ${styles[`ownership-${ownership}`]}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {task.title}
          {ownership === 'self' && <span className={styles.ownershipBadge}>My Task</span>}
          {ownership === 'friend' && <span className={styles.ownershipBadge}>Friend's Task</span>}
        </h3>
        <span className={`${styles.status} ${statusClass}`}>
          {task.status}
        </span>
      </div>
      
      {task.assigner && (
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
      
      {/* Submission Information & Actions */}
      {task.status === TaskStatus.IN_PROGRESS && ownership === 'self' && (
        <div className={styles.submissionContainer}>
          {/* Submission Type */}
          <div className={styles.submissionSection}>
            <div className={styles.submissionHeader}>
              <span className={styles.submissionLabel}>
                <span className={styles.submissionIcon}>📋</span> Submission Type
              </span>
              <span className={styles.submissionValue}>
                {task.submissionType === SubmissionType.FORM ? 'Text' : 
                  task.submissionType === SubmissionType.LINK ? 'Link' : 
                  task.submissionType === SubmissionType.FILE ? 'File' : 'None'}
              </span>
            </div>
          </div>
          
          {/* Submission Content */}
          <div className={styles.submissionSection}>
            <div className={styles.submissionHeader}>
              <span className={styles.submissionLabel}>
                <span className={styles.submissionIcon}>📄</span> Submission
              </span>
            </div>
            
            <div className={styles.submissionEditor}>
              {task.submissionType === SubmissionType.FORM && (
                <textarea
                  className={styles.submissionTextarea}
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder={task.submissionInstructions || "Enter your text submission here..."}
                  rows={4}
                />
              )}
              
              {task.submissionType === SubmissionType.LINK && (
                <div className={styles.linkInputContainer}>
                  <input
                    type="url"
                    className={styles.submissionInput}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder={task.submissionInstructions || "Enter URL (e.g., https://example.com)"}
                  />
                </div>
              )}
              
              {task.submissionType === SubmissionType.FILE && (
                <div className={styles.fileInputContainer}>
                  <input
                    type="text"
                    className={styles.submissionInput}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder={task.submissionInstructions || "Enter file URL"}
                  />
                </div>
              )}
              
              <div className={styles.submissionActions}>
                <button 
                  className={styles.saveButton}
                  onClick={handleSaveSubmission}
                >
                  Save for Later
                </button>
                <button 
                  className={styles.submitButton}
                  onClick={handleSubmitAndComplete}
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.actions}>
        {ownership === 'self' && task.status === TaskStatus.PENDING && (
          <Button 
            size="sm" 
            variant="info" 
            onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
          >
            Start Task
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant={showDetails ? "outline" : "primary"}
          onClick={handleViewTaskDetails}
        >
          {showDetails ? 'View Full Details' : 'View Task'}
        </Button>
      </div>
    </div>
  );
};

export default TaskCard; 