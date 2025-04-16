'use client';

import { useState, FormEvent } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';

const CreateTaskForm = () => {
  const { user } = useAuth();
  const { friendships, addTask } = useDatabase();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>();
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // On component mount, set the default assignee to self
  useState(() => {
    if (user) {
      setAssigneeId(user.id);
    }
  });
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate inputs
      if (!title || !dueDate || !assigneeId) {
        throw new Error('Please fill all required fields');
      }
      
      // Create task object
      const taskData: Omit<Task, 'id' | 'createdAt'> = {
        title,
        description,
        dueDate: new Date(dueDate),
        assignerId: user.id,
        assigneeId,
        status: TaskStatus.PENDING,
        priority,
        estimatedTimeMinutes: estimatedTime
      };
      
      // Submit task
      const newTask = await addTask(taskData);
      
      if (!newTask) {
        throw new Error('Failed to create task');
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority(TaskPriority.MEDIUM);
      setEstimatedTime(undefined);
      setSuccess(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If user is not logged in, don't render the form
  if (!user) {
    return null;
  }
  
  return (
    <div className="create-task-form">
      <h2>Create New Task</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Task created successfully!</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dueDate">Due Date *</label>
          <input
            type="datetime-local"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="estimatedTime">Estimated Time (minutes)</label>
          <input
            type="number"
            id="estimatedTime"
            value={estimatedTime || ''}
            onChange={(e) => setEstimatedTime(e.target.value ? parseInt(e.target.value) : undefined)}
            min="1"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="assignee">Assign To *</label>
          <select
            id="assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            required
          >
            <option value={user.id}>Myself</option>
            {friendships.map(friendship => (
              <option key={friendship.friend?.id} value={friendship.friend?.id}>
                {friendship.friend?.name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </button>
      </form>
      <style jsx>{`
        .create-task-form {
          background-color: #fff;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          margin: 0 auto;
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 24px;
          color: #333;
          font-size: 24px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #555;
        }
        
        input,
        textarea,
        select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        input:focus,
        textarea:focus,
        select:focus {
          border-color: #0070f3;
          outline: none;
        }
        
        .submit-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%;
          margin-top: 8px;
        }
        
        .submit-button:hover {
          background-color: #0060df;
        }
        
        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #fff0f0;
          color: #d32f2f;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        
        .success-message {
          background-color: #f0fff0;
          color: #388e3c;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default CreateTaskForm; 