import React, { useState } from 'react';
import { Task } from '../types';
import './TaskSubmissionForm.css'; // Reusing styles from submission form

interface TaskReviewFormProps {
  task: Task;
  onReviewTask: (taskId: string, review: {
    qualityRating: number;
    timelinessRating: number;
    effortRating: number;
    accuracyRating: number;
    feedback: string;
  }) => Promise<void>;
}

const TaskReviewForm: React.FC<TaskReviewFormProps> = ({
  task,
  onReviewTask
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [effortRating, setEffortRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle submission of review
  const handleSubmitReview = async () => {
    try {
      // Validate ratings
      if (qualityRating === 0 || timelinessRating === 0 || 
          effortRating === 0 || accuracyRating === 0) {
        setError('Please provide a rating for all criteria');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      await onReviewTask(task.id, {
        qualityRating,
        timelinessRating,
        effortRating,
        accuracyRating,
        feedback
      });
      
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render star rating component
  const renderRatingStars = (
    currentRating: number,
    setRating: (rating: number) => void,
    label: string
  ) => {
    return (
      <div className="rating-group">
        <div className="rating-label">{label}</div>
        <div className="rating-container">
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`rating-star ${star <= currentRating ? 'filled' : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Display submission content based on type
  const renderSubmissionContent = () => {
    if (!task.submissionContent) {
      return <p>No submission content available</p>;
    }

    // If it's a URL, make it clickable
    if (task.submissionContent.startsWith('http')) {
      return (
        <div>
          <p>Submission Link:</p>
          <a 
            href={task.submissionContent} 
            target="_blank" 
            rel="noopener noreferrer"
            className="submission-link"
          >
            {task.submissionContent}
          </a>
        </div>
      );
    }

    // Otherwise display as text
    return (
      <div>
        <p>Submission:</p>
        <div className="submission-text">{task.submissionContent}</div>
      </div>
    );
  };

  return (
    <div className="submission-form-container">
      <div className="submission-form-header">
        <h2 className="submission-form-title">Review Task Submission</h2>
        <p className="submission-form-description">
          Rate the submission on multiple criteria and provide feedback
        </p>
      </div>
      
      <div className="submission-content">
        {renderSubmissionContent()}
      </div>
      
      <div className="review-form">
        {renderRatingStars(qualityRating, setQualityRating, 'Overall Quality')}
        {renderRatingStars(timelinessRating, setTimelinessRating, 'Timeliness')}
        {renderRatingStars(effortRating, setEffortRating, 'Effort')}
        {renderRatingStars(accuracyRating, setAccuracyRating, 'Accuracy')}
        
        <div className="form-group">
          <label className="form-label">Feedback:</label>
          <textarea
            className="feedback-textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide detailed feedback on the submission..."
            disabled={isLoading}
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <button 
          className="submission-form-button review-button" 
          onClick={handleSubmitReview}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting Review...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

export default TaskReviewForm; 