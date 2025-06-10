'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicTask, TaskCompletionType, TasklAppocationType, PayoutMethod, GradingMethod, User, PublicTaskApplication, ApplicationStatus } from '../../../types';
import { getPublicTaskById, createApplication, getUserApplicationForTask } from '../../../lib/api/publicTasks';
import { useAuth } from '../../../context/AuthContext';
import BackButton from '../../../components/ui/BackButton';
import Button from '../../../components/ui/Button';
import styles from './PublicTaskDetail.module.css';

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

function formatGradingMethod(method: GradingMethod) {
  switch (method) {
    case GradingMethod.CREATOR_ONLY: return 'Creator Only';
    case GradingMethod.COMMUNITY_VOTING: return 'Community Voting';
    case GradingMethod.BOTH: return 'Creator + Community';
    default: return method;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

const PublicTaskDetailPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [task, setTask] = useState<PublicTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [userApplication, setUserApplication] = useState<PublicTaskApplication | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  useEffect(() => {
    if (user && task) {
      checkUserApplication();
    }
  }, [user, task]);

  const fetchTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const taskData = await getPublicTaskById(id as string);
      if (!taskData) {
        setError('Task not found');
        return;
      }
      setTask(taskData);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserApplication = async () => {
    if (!user || !task) return;

    setIsCheckingApplication(true);
    try {
      const application = await getUserApplicationForTask(task.id, user.id);
      setUserApplication(application);
    } catch (err) {
      console.error('Error checking user application:', err);
    } finally {
      setIsCheckingApplication(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (userApplication) {
      return;
    }

    setShowApplicationModal(true);
  };

  const handleCloseModal = () => {
    setShowApplicationModal(false);
    setApplicationError(null);
  };

  const handleSubmitApplication = async (applicationData: {
    applicationMessage: string;
    contactEmail: string;
    contactPhone?: string;
    submissionContent?: string;
  }) => {
    if (!user || !task) return;

    setIsSubmittingApplication(true);
    setApplicationError(null);

    try {
      const newApplication = await createApplication(task.id, user.id, applicationData);
      setUserApplication(newApplication);
      setApplicationSuccess(true);
      setShowApplicationModal(false);
      
      setTask(prevTask => prevTask ? {
        ...prevTask,
        applicationCount: prevTask.applicationCount + 1
      } : null);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      
      if (err.message?.includes('duplicate') || err.code === '23505') {
        setApplicationError('You have already applied to this task.');
        checkUserApplication();
      } else {
        setApplicationError('Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleCreateAccount = () => {
    router.push('/signup?redirect=' + encodeURIComponent(window.location.pathname));
  };

  const getApplicationStatusText = () => {
    if (!userApplication) return null;
    
    switch (userApplication.status) {
      case ApplicationStatus.PENDING:
        return 'Your application is pending review';
      case ApplicationStatus.ACCEPTED:
        return 'Your application has been accepted!';
      case ApplicationStatus.REJECTED:
        return 'Your application was not selected';
      case ApplicationStatus.COMPLETED:
        return 'You have completed this task';
      case ApplicationStatus.GRADED:
        return 'This task has been graded';
      default:
        return 'Application submitted';
    }
  };

  const getApplicationButtonText = () => {
    if (!user) return 'Apply for This Task';
    if (isCheckingApplication) return 'Checking...';
    if (userApplication) {
      switch (userApplication.status) {
        case ApplicationStatus.PENDING:
          return 'Application Submitted';
        case ApplicationStatus.ACCEPTED:
          return 'Application Accepted';
        case ApplicationStatus.REJECTED:
          return 'Application Rejected';
        case ApplicationStatus.COMPLETED:
          return 'Task Completed';
        case ApplicationStatus.GRADED:
          return 'Task Graded';
        default:
          return 'Application Submitted';
      }
    }
    return 'Apply for This Task';
  };

  const canApply = () => {
    return user && !userApplication && !isCheckingApplication;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error || 'Task not found'}</p>
          <Button onClick={() => router.push('/public-tasks')}>
            Back to Public Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackButton route="/public-tasks" />
        <div className={styles.headerActions}>
          {user ? (
            <Button 
              onClick={handleApply} 
              variant={canApply() ? "primary" : "outline"}
              disabled={!canApply()}
            >
              {getApplicationButtonText()}
            </Button>
          ) : (
            <>
              <Button onClick={handleApply} variant="primary">
                Apply for This Task
              </Button>
              <Button onClick={handleCreateAccount} variant="outline">
                Create Account
              </Button>
            </>
          )}
        </div>
      </div>

      {applicationSuccess && (
        <div className={styles.successBanner}>
          <p>Your application has been submitted successfully! The task creator will review it and get back to you.</p>
        </div>
      )}

      {userApplication && !applicationSuccess && (
        <div className={`${styles.statusBanner} ${styles[userApplication.status.toLowerCase()]}`}>
          <p>{getApplicationStatusText()}</p>
          <small>Applied on {userApplication.appliedAt.toLocaleDateString()}</small>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <div className={styles.taskHeader}>
            <h1 className={styles.title}>{task.title}</h1>
            <div className={styles.taskMeta}>
              <div className={styles.creator}>
                {task.creator?.avatarUrl && (
                  <img 
                    src={task.creator.avatarUrl} 
                    alt={task.creator.name}
                    className={styles.creatorAvatar}
                  />
                )}
                <span>by {task.creator?.name || 'Unknown'}</span>
              </div>
              <div className={styles.stats}>
                <span>{task.viewCount} views</span>
                <span>{task.applicationCount} applications</span>
              </div>
            </div>
          </div>

          <div className={styles.description}>
            <h2>Description</h2>
            <div className={styles.descriptionContent}>
              {task.description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {task.media && task.media.length > 0 && (
            <div className={styles.mediaSection}>
              <h2>Attachments</h2>
              <div className={styles.mediaGrid}>
                {task.media.map((media) => (
                  <div key={media.id} className={styles.mediaItem}>
                    {media.fileType === 'image' ? (
                      <img 
                        src={media.fileUrl} 
                        alt={media.fileName || 'Task attachment'}
                        className={styles.mediaImage}
                        onClick={() => window.open(media.fileUrl, '_blank')}
                      />
                    ) : (
                      <div className={styles.videoContainer}>
                        <video 
                          src={media.fileUrl}
                          controls
                          className={styles.mediaVideo}
                        />
                      </div>
                    )}
                    {media.fileName && (
                      <p className={styles.mediaFileName}>{media.fileName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.submissionInstructions && (
            <div className={styles.submissionSection}>
              <h2>Submission Instructions</h2>
              <div className={styles.submissionContent}>
                {task.submissionInstructions.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.paymentCard}>
            <h3>Payment</h3>
            <div className={styles.paymentAmount}>
              {formatCurrency(task.paymentAmount, task.paymentCurrency)}
            </div>
            {task.supportedPayoutMethods.length > 0 && (
              <div className={styles.payoutMethods}>
                <span className={styles.label}>Payment Methods:</span>
                <span>{formatPayoutMethods(task.supportedPayoutMethods)}</span>
              </div>
            )}
          </div>

          <div className={styles.detailsCard}>
            <h3>Task Details</h3>
            <div className={styles.detailItem}>
              <span className={styles.label}>Type:</span>
              <span>{formatCompletionType(task.completionType)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Location:</span>
              <span>{formatLocationType(task.locationType)}</span>
            </div>
            {task.locationCity && (
              <div className={styles.detailItem}>
                <span className={styles.label}>City:</span>
                <span>{task.locationCity}{task.locationCountry && `, ${task.locationCountry}`}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.label}>Language:</span>
              <span>{task.language}</span>
            </div>
            {task.maxApplicants && (
              <div className={styles.detailItem}>
                <span className={styles.label}>Max Applicants:</span>
                <span>{task.maxApplicants}</span>
              </div>
            )}
            {task.deadline && (
              <div className={styles.detailItem}>
                <span className={styles.label}>Deadline:</span>
                <span>{formatDate(task.deadline)}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.label}>Grading:</span>
              <span>{formatGradingMethod(task.gradingMethod)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Posted:</span>
              <span>{formatDate(task.createdAt)}</span>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className={styles.tagsCard}>
              <h3>Tags</h3>
              <div className={styles.tags}>
                {task.tags.map((tag) => (
                  <span key={tag.id} className={styles.tag}>
                    {tag.tagName}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionCard}>
            {user ? (
              <>
                <Button 
                  onClick={handleApply} 
                  variant={canApply() ? "primary" : "outline"}
                  disabled={!canApply()}
                  className={styles.applyButton}
                >
                  {getApplicationButtonText()}
                </Button>
                {userApplication && userApplication.status === ApplicationStatus.PENDING && (
                  <p className={styles.helpText}>
                    Your application is being reviewed by the task creator.
                  </p>
                )}
              </>
            ) : (
              <>
                <Button onClick={handleApply} variant="primary" className={styles.applyButton}>
                  Apply for This Task
                </Button>
                <Button onClick={handleCreateAccount} variant="outline">
                  Create Account to Apply
                </Button>
                <p className={styles.helpText}>
                  Create an account to apply for tasks, track your applications, and build your reputation.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {showApplicationModal && (
        <ApplicationModal
          task={task}
          user={user!}
          onClose={handleCloseModal}
          onSubmit={handleSubmitApplication}
          isSubmitting={isSubmittingApplication}
          error={applicationError}
        />
      )}
    </div>
  );
};

interface ApplicationModalProps {
  task: PublicTask;
  user: User;
  onClose: () => void;
  onSubmit: (data: {
    applicationMessage: string;
    contactEmail: string;
    contactPhone?: string;
    submissionContent?: string;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}

function ApplicationModal({ task, user, onClose, onSubmit, isSubmitting, error }: ApplicationModalProps) {
  const [applicationMessage, setApplicationMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [submissionContent, setSubmissionContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationMessage.trim()) {
      return;
    }

    const isProofBased = task.completionType === TaskCompletionType.PROOF_BASED;
    
    onSubmit({
      applicationMessage: applicationMessage.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || undefined,
      submissionContent: isProofBased ? submissionContent.trim() || undefined : undefined
    });
  };

  const isProofBased = task.completionType === TaskCompletionType.PROOF_BASED;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Apply for Task</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="applicationMessage">Application Message *</label>
            <textarea
              id="applicationMessage"
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              placeholder={isProofBased ? 
                "Explain your approach to completing this task..." : 
                "Why are you the right person for this task? What relevant experience do you have?"}
              rows={4}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contactEmail">Contact Email *</label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contactPhone">Contact Phone (Optional)</label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {isProofBased && (
            <div className={styles.formGroup}>
              <label htmlFor="submissionContent">Proof of Completion (Optional)</label>
              <textarea
                id="submissionContent"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="If you've already completed this task, provide proof here (links, descriptions, etc.)"
                rows={3}
              />
              <small className={styles.helpText}>
                For proof-based tasks, you can submit your proof now or after being accepted.
              </small>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.modalActions}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting || !applicationMessage.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublicTaskDetailPage;