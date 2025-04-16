'use client';

import React, { useState, FormEvent } from 'react';
import { User, Task, TaskPriority, TaskStatus, SubmissionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { createTask } from '../../lib/api/supabase';
import styles from './CreateTaskModal.module.css';

interface CreateTaskModalProps {
  assigneeId: string;
  assigneeName: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  assigneeId,
  assigneeName,
  onClose,
  onCreated
}) => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState<number | undefined>();
  const [submissionType, setSubmissionType] = useState<SubmissionType>(SubmissionType.FORM);
  const [submissionInstructions, setSubmissionInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tomorrow's date for default value
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Get current time for default value
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!title || !dueDate) {
        throw new Error('Please fill all required fields');
      }
      
      // Create a proper date object with the selected date and time
      const dueDateObj = new Date(`${dueDate}T${dueTime || '23:59'}:00`);
      
      // Create task object
      const newTask = {
        title,
        description,
        dueDate: dueDateObj,
        assignerId: user.id,
        assigneeId,
        status: TaskStatus.PENDING,
        priority,
        estimatedTimeMinutes,
        submissionType,
        submissionInstructions: submissionInstructions.trim() || undefined
      };
      
      // Submit task
      await createTask(newTask);
      
      // Notify parent component
      onCreated();
      
      // Close modal
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Assign Task to {assigneeName}</h2>
          <button 
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className={styles.modalContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                placeholder="Task title"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                placeholder="Task description"
                rows={4}
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 2 }}>
                <label htmlFor="dueDate" className={styles.label}>Due Date *</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate || getTomorrowDate()}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="dueTime" className={styles.label}>Time</label>
                <input
                  type="time"
                  id="dueTime"
                  value={dueTime || getCurrentTime()}
                  onChange={(e) => setDueTime(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="priority" className={styles.label}>Priority</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={styles.select}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="estimatedTime" className={styles.label}>Estimated Time (minutes)</label>
                <input
                  type="number"
                  id="estimatedTime"
                  value={estimatedTimeMinutes || ''}
                  onChange={(e) => setEstimatedTimeMinutes(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1"
                  className={styles.input}
                  placeholder="e.g. 30"
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Submission Type</label>
              <div className={styles.submissionTypeContainer}>
                <div 
                  className={`${styles.typeOption} ${submissionType === SubmissionType.FORM ? styles.selected : ''}`}
                  onClick={() => setSubmissionType(SubmissionType.FORM)}
                >
                  <span>Text</span>
                </div>
                <div 
                  className={`${styles.typeOption} ${submissionType === SubmissionType.LINK ? styles.selected : ''}`}
                  onClick={() => setSubmissionType(SubmissionType.LINK)}
                >
                  <span>Link</span>
                </div>
                <div 
                  className={`${styles.typeOption} ${submissionType === SubmissionType.FILE ? styles.selected : ''}`}
                  onClick={() => setSubmissionType(SubmissionType.FILE)}
                >
                  <span>File</span>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="submissionInstructions" className={styles.label}>Submission Instructions</label>
              <textarea
                id="submissionInstructions"
                value={submissionInstructions}
                onChange={(e) => setSubmissionInstructions(e.target.value)}
                className={styles.textarea}
                placeholder="Instructions for how the task should be submitted"
                rows={3}
              />
            </div>
            
            <div className={styles.formActions}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal; 