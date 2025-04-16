'use client';

import React, { useState, FormEvent } from 'react';
import { User, Task, TaskPriority, TaskStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { createTask } from '../../lib/api/supabase';
import styles from './CreateTaskModal.module.css';

interface CreateTaskModalProps {
  assigneeId: string;
  assigneeName: string;
  assignerId: string;
  assignerName: string;
  onClose: () => void;
  onCreated: () => void;
  onTaskCreated?: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  assigneeId,
  assigneeName,
  assignerId,
  assignerName,
  onClose,
  onCreated,
  onTaskCreated
}) => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tomorrow's date for default value
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!title || !dueDate) {
        throw new Error('Please fill all required fields');
      }
      
      // Make sure we have a valid assignerId
      const effectiveAssignerId = assignerId || (user?.id ?? '');
      if (!effectiveAssignerId) {
        throw new Error('Invalid assigner ID');
      }
      
      // Create task object
      const newTask = {
        title,
        description,
        dueDate: new Date(dueDate),
        assignerId: effectiveAssignerId,
        assigneeId,
        status: TaskStatus.PENDING,
        priority,
        estimatedTimeMinutes
      };
      
      // Submit task
      await createTask(newTask);
      
      // Notify parent component
      onCreated();
      if (onTaskCreated) onTaskCreated();
      
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
              <div className={styles.formGroup}>
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