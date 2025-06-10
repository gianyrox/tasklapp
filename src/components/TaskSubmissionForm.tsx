import React, { useState, useEffect } from 'react';
import { Task, SubmissionType, TaskStatus } from '../types';
import { validateFileSize } from '../lib/utils/fileValidation';
import './TaskSubmissionForm.css';

interface TaskSubmissionFormProps {
  task: Task;
  onStartTask: (taskId: string) => Promise<void>;
  onSubmitTask: (taskId: string, submissionContent: string) => Promise<void>;
  onFileUpload?: (taskId: string, file: File) => Promise<string>;
}

const TaskSubmissionForm: React.FC<TaskSubmissionFormProps> = ({
  task,
  onStartTask,
  onSubmitTask,
  onFileUpload
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [linkContent, setLinkContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine if task is in progress
  const isTaskInProgress = task.status === TaskStatus.IN_PROGRESS;
  
  // Handle starting the task
  const handleStartTask = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onStartTask(task.id);
    } catch (err) {
      setError('Failed to start task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task submission
  const handleSubmitTask = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let finalContent = '';
      
      // Process different submission types
      if (task.submissionType === SubmissionType.FORM) {
        finalContent = textContent;
      } else if (task.submissionType === SubmissionType.LINK) {
        finalContent = linkContent;
      } else if (task.submissionType === SubmissionType.FILE && selectedFile && onFileUpload) {
        // Upload file and get URL
        const fileUrl = await onFileUpload(task.id, selectedFile);
        finalContent = fileUrl;
      }
      
      if (!finalContent.trim()) {
        throw new Error('Please provide submission content');
      }
      
      await onSubmitTask(task.id, finalContent);
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      const validation = validateFileSize(file);
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  // Render different submission forms based on type
  const renderSubmissionForm = () => {
    if (!isTaskInProgress) {
      return (
        <button 
          className="submission-form-button start-button" 
          onClick={handleStartTask}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Start Task'}
        </button>
      );
    }

    switch (task.submissionType) {
      case SubmissionType.FORM:
        return (
          <div className="form-group">
            <label className="form-label">Your submission:</label>
            <textarea
              className="submission-form-input submission-form-textarea"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your submission here..."
              disabled={isLoading}
            />
          </div>
        );
        
      case SubmissionType.LINK:
        return (
          <div className="form-group">
            <label className="form-label">Submission URL:</label>
            <div className="url-input-container">
              <span className="url-input-prefix">https://</span>
              <input
                type="text"
                className="submission-form-input url-input"
                value={linkContent}
                onChange={(e) => setLinkContent(e.target.value)}
                placeholder="example.com/your-submission"
                disabled={isLoading}
              />
            </div>
          </div>
        );
        
      case SubmissionType.FILE:
        return (
          <div className="form-group">
            <label className="form-label">Upload File:</label>
            <div 
              className="file-upload-container"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {selectedFile ? (
                <p className="file-upload-text">Selected: {selectedFile.name}</p>
              ) : (
                <p className="file-upload-text">Click to select a file or drag and drop</p>
              )}
              <input
                id="file-upload"
                type="file"
                className="file-upload-input"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="form-group">
            <label className="form-label">Your submission:</label>
            <textarea
              className="submission-form-input submission-form-textarea"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your submission here..."
              disabled={isLoading}
            />
          </div>
        );
    }
  };

  return (
    <div className="submission-form-container">
      <div className="submission-form-header">
        <h2 className="submission-form-title">
          {isTaskInProgress ? 'Submit Your Work' : 'Start Working on This Task'}
        </h2>
        <p className="submission-form-description">
          {isTaskInProgress 
            ? 'Complete the form below to submit your task for review.' 
            : 'Click the button below to start working on this task.'}
        </p>
      </div>
      
      {task.submissionInstructions && (
        <div className="submission-instructions">
          <strong>Instructions:</strong> {task.submissionInstructions}
        </div>
      )}
      
      {renderSubmissionForm()}
      
      {error && <p className="error-message">{error}</p>}
      
      {isTaskInProgress && (
        <button 
          className="submission-form-button submit-button" 
          onClick={handleSubmitTask}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Task'}
        </button>
      )}
    </div>
  );
};

export default TaskSubmissionForm; 