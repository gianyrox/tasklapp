'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import { Task, TaskStatus } from '../../../types';
import ProtectedRoute from '../../../components/layout/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import BackButton from '../../../components/ui/BackButton';
import { getTaskById, updateTaskStatus } from '../../../lib/api/supabase';
import styles from './TaskDetail.module.css';

// Helper function to calculate average rating
const calculateAverageRating = (task: Task): string => {
  // Get all available ratings
  const ratings = [
    task.qualityRating || 0,
    task.timelinessRating || 0,
    task.effortRating || 0,
    task.accuracyRating || 0
  ].filter(rating => rating > 0);
  
  // If no ratings, return 0
  if (ratings.length === 0) return '0.0';
  
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return (sum / ratings.length).toFixed(1);
};

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // States for task grading
  const [qualityRating, setQualityRating] = useState<number>(0);
  const [timelinessRating, setTimelinessRating] = useState<number>(0);
  const [effortRating, setEffortRating] = useState<number>(0);
  const [accuracyRating, setAccuracyRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [showGradingSection, setShowGradingSection] = useState(false);

  useEffect(() => {
    if (user && taskId) {
      fetchTaskData();
    }
  }, [user, taskId]);

  const fetchTaskData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const taskData = await getTaskById(taskId as string);
      setTask(taskData);
    } catch (err) {
      console.error('Error fetching task data:', err);
      setError('Failed to load task data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      // Refresh task data
      fetchTaskData();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle task grading submission
  const handleSubmitGrade = async () => {
    if (!task) return;
    
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, TaskStatus.GRADED, {
        qualityRating: qualityRating,
        timelinessRating: timelinessRating,
        effortRating: effortRating,
        accuracyRating: accuracyRating,
        feedback: feedback
      });
      // Refresh task data and hide grading section
      await fetchTaskData();
      setShowGradingSection(false);
    } catch (err) {
      console.error('Error submitting grade:', err);
      setError('Failed to submit grade. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Render star rating component
  const renderRatingStars = (rating: number, setRating: (rating: number) => void) => {
    return (
      <div className={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`${styles.ratingStar} ${star <= rating ? styles.ratingStarFilled : ''}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading task details...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.container}>
            <BackButton route="/task" />
            
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchTaskData}>
                Try Again
              </Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className={styles.container}>
            <BackButton route="/task" />
            
            <div className={styles.errorMessage}>
              <p>Task not found</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const isTaskAssignee = user?.id === task.assigneeId;
  const isTaskAssigner = user?.id === task.assignerId;
  const canUpdate = isTaskAssignee || isTaskAssigner;
  const isDue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  const needsGrading = isTaskAssigner && task.status === TaskStatus.COMPLETED && !task.qualityRating;

  // Set icons for each section
  const sectionIcons = {
    description: "✏️",
    details: "📋",
    people: "👥",
    grade: "🏆"
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className={styles.container}>
          <BackButton route="/task" />
        
          <div className={styles.header}>
            <h1 className={styles.title}>
              {task.title}
              {task.status === TaskStatus.GRADED && task.qualityRating && (
                <span className={styles.gradeIndicator}>
                  Grade: {calculateAverageRating(task)}/5
                </span>
              )}
            </h1>
            <div className={styles.meta}>
              <span className={`${styles.status} ${styles[task.status.toLowerCase()]}`}>
                {task.status}
              </span>
              {isDue && <span className={styles.overdueTag}>OVERDUE</span>}
            </div>
          </div>

          <div className={styles.actions}>
            {canUpdate && (
              <div className={styles.statusButtons}>
                {task.status !== TaskStatus.PENDING && (
                  <button 
                    onClick={() => handleStatusChange(TaskStatus.PENDING)}
                    disabled={isUpdating}
                    className={styles.actionButton}
                  >
                    Mark as Pending
                  </button>
                )}
                
                {task.status !== TaskStatus.IN_PROGRESS && (
                  <button 
                    onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                    disabled={isUpdating}
                    className={styles.actionButton}
                  >
                    Mark as In Progress
                  </button>
                )}
                
                {task.status !== TaskStatus.COMPLETED && (
                  <button 
                    onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                    disabled={isUpdating}
                    className={`${styles.actionButton} ${styles.primaryAction}`}
                  >
                    ✅ Mark as Completed
                  </button>
                )}
              </div>
            )}
            
            {needsGrading && (
              <button 
                onClick={() => setShowGradingSection(!showGradingSection)}
                className={`${styles.actionButton} ${styles.primaryAction}`}
              >
                {showGradingSection ? 'Hide Grading Form' : '📝 Grade this Task'}
              </button>
            )}
          </div>

          <div className={styles.content}>
            <div className={styles.mainContent}>
              <div className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles.descriptionIcon}`}>
                  {sectionIcons.description} Description
                </h2>
                <p className={styles.description}>{task.description || 'No description provided.'}</p>
              </div>

              <div className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles.detailsIcon}`}>
                  {sectionIcons.details} Details
                </h2>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Due Date</span>
                    <span className={styles.detailValue}>
                      {new Date(task.dueDate).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Priority</span>
                    <span className={styles.detailValue}>{task.priority}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>{task.status}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Created</span>
                    <span className={styles.detailValue}>
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {task.startedAt && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Started</span>
                      <span className={styles.detailValue}>
                        {new Date(task.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {task.completedAt && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Completed</span>
                      <span className={styles.detailValue}>
                        {new Date(task.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* New Grade Section */}
              {(task.status === TaskStatus.GRADED || task.qualityRating || 
                task.estimatedTimeMinutes || task.actualTimeMinutes || 
                task.submissionDate || task.submissionContent) && (
                <div className={styles.section}>
                  <h2 className={`${styles.sectionTitle} ${styles.gradeIcon}`}>
                    {sectionIcons.grade} Grade
                  </h2>
                  <div className={styles.detailsGrid}>
                    {task.estimatedTimeMinutes && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Estimated Time</span>
                        <span className={styles.detailValue}>{task.estimatedTimeMinutes} minutes</span>
                      </div>
                    )}
                    
                    {task.actualTimeMinutes && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Actual Time</span>
                        <span className={styles.detailValue}>{task.actualTimeMinutes} minutes</span>
                      </div>
                    )}

                    {task.submissionDate && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Submitted</span>
                        <span className={styles.detailValue}>
                          {new Date(task.submissionDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {task.submissionContent && (
                      <div className={`${styles.detailItem} ${styles.feedbackDetail}`}>
                        <span className={styles.detailLabel}>
                          <span className={styles.submissionIcon}>📄</span> Submission Content
                        </span>
                        <div className={styles.submissionWrapper}>
                          <p className={styles.feedbackText}>{task.submissionContent}</p>
                        </div>
                      </div>
                    )}
                    
                    {task.qualityRating && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Quality Rating</span>
                        <span className={styles.detailValue}>{task.qualityRating}/5</span>
                      </div>
                    )}
                    
                    {task.timelinessRating && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Timeliness Rating</span>
                        <span className={styles.detailValue}>{task.timelinessRating}/5</span>
                      </div>
                    )}
                    
                    {task.effortRating && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Effort Rating</span>
                        <span className={styles.detailValue}>{task.effortRating}/5</span>
                      </div>
                    )}
                    
                    {task.accuracyRating && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Accuracy Rating</span>
                        <span className={styles.detailValue}>{task.accuracyRating}/5</span>
                      </div>
                    )}
                    
                    {task.qualityRating && task.timelinessRating && task.effortRating && task.accuracyRating && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Average Rating</span>
                        <span className={styles.detailValue}>
                          {calculateAverageRating(task)}/5
                        </span>
                      </div>
                    )}
                    
                    {task.feedback && (
                      <div className={`${styles.detailItem} ${styles.feedbackDetail}`}>
                        <span className={styles.detailLabel}>Feedback</span>
                        <p className={styles.feedbackText}>{task.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.section}>
                <h2 className={`${styles.sectionTitle} ${styles.peopleIcon}`}>
                  {sectionIcons.people} People
                </h2>
                <div className={styles.people}>
                  <div className={styles.person}>
                    <span className={styles.personRole}>Assigned by</span>
                    <div className={styles.personInfo}>
                      {task.assigner?.avatarUrl && (
                        <img 
                          src={task.assigner.avatarUrl} 
                          alt={task.assigner.name} 
                          className={styles.avatar} 
                        />
                      )}
                      <span className={styles.personName}>{task.assigner?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className={styles.person}>
                    <span className={styles.personRole}>Assigned to</span>
                    <div className={styles.personInfo}>
                      {task.assignee?.avatarUrl && (
                        <img 
                          src={task.assignee.avatarUrl} 
                          alt={task.assignee.name} 
                          className={styles.avatar} 
                        />
                      )}
                      <span className={styles.personName}>{task.assignee?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {showGradingSection && (
              <div className={styles.gradingSection}>
                <h2 className={styles.gradingTitle}>Review & Grade</h2>
                <div className={styles.gradingForm}>
                  <div className={styles.gradingField}>
                    <label className={styles.gradingLabel}>Quality Rating:</label>
                    {renderRatingStars(qualityRating, setQualityRating)}
                    <p className={styles.ratingDescription}>Rate the overall quality of work</p>
                  </div>
                  
                  <div className={styles.gradingField}>
                    <label className={styles.gradingLabel}>Timeliness Rating:</label>
                    {renderRatingStars(timelinessRating, setTimelinessRating)}
                    <p className={styles.ratingDescription}>Rate how promptly the task was completed</p>
                  </div>
                  
                  <div className={styles.gradingField}>
                    <label className={styles.gradingLabel}>Effort Rating:</label>
                    {renderRatingStars(effortRating, setEffortRating)}
                    <p className={styles.ratingDescription}>Rate the level of effort demonstrated</p>
                  </div>
                  
                  <div className={styles.gradingField}>
                    <label className={styles.gradingLabel}>Accuracy Rating:</label>
                    {renderRatingStars(accuracyRating, setAccuracyRating)}
                    <p className={styles.ratingDescription}>Rate how accurately requirements were met</p>
                  </div>
                  
                  <div className={styles.gradingField}>
                    <label className={styles.gradingLabel}>Feedback:</label>
                    <textarea 
                      className={styles.feedbackInput}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback on the completed task..."
                      rows={4}
                    />
                  </div>
                  
                  <div className={styles.gradingActions}>
                    <Button 
                      variant="primary" 
                      onClick={handleSubmitGrade}
                      disabled={isUpdating || qualityRating === 0}
                    >
                      {isUpdating ? 'Submitting...' : 'Submit Grade'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowGradingSection(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default TaskDetailPage; 