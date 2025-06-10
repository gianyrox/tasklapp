'use client';

import React, { useState } from 'react';
import {
  CreatePublicTaskData,
  TaskCompletionType,
  TaskLocationType,
  PayoutMethod,
  GradingMethod,
  MediaFile
} from '../../types';
import { createPublicTask } from '../../lib/api/publicTasks';
import { useAuth } from '../../context/AuthContext';
import styles from './CreatePublicTaskModal.module.css';
import Button from '../ui/Button';
import { validateFileSize, validateMediaFileType, FILE_SIZE_LIMITS } from '../../lib/utils/fileValidation';

interface CreatePublicTaskModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreatePublicTaskModal: React.FC<CreatePublicTaskModalProps> = ({
  onClose,
  onCreated
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePublicTaskData>({
    title: '',
    description: '',
    completionType: TaskCompletionType.APPLICATION_BASED,
    locationType: TaskLocationType.REMOTE,
    locationAddress: '',
    locationCity: '',
    locationCountry: '',
    language: 'English',
    paymentAmount: 0,
    paymentCurrency: 'USD',
    supportedPayoutMethods: [PayoutMethod.PAYPAL],
    gradingMethod: GradingMethod.CREATOR_ONLY,
    submissionInstructions: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user?.id) {
      setError('You must be logged in to create a public task');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (formData.paymentAmount < 0) {
      setError('Payment amount must be positive');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createPublicTask(formData, user.id, mediaFiles);
      onCreated();
      onClose();
    } catch (err) {
      console.error('Error creating public task:', err);
      setError('Failed to create public task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (field: keyof CreatePublicTaskData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayoutMethodToggle = (method: PayoutMethod) => {
    setFormData(prev => ({
      ...prev,
      supportedPayoutMethods: prev.supportedPayoutMethods.includes(method)
        ? prev.supportedPayoutMethods.filter(m => m !== method)
        : [...prev.supportedPayoutMethods, method]
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.isValid) {
        setError(sizeValidation.error!);
        return;
      }

      const typeValidation = validateMediaFileType(file);
      if (!typeValidation.isValid) {
        setError(typeValidation.error!);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const mediaFile: MediaFile = {
          file,
          preview: event.target?.result as string,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        };
        
        setMediaFiles(prev => [...prev, mediaFile]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }

  function handleRemoveMedia(index: number) {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Create Public Task</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <div className={styles.field}>
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what needs to be done"
                rows={4}
                required
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Task Details</h3>
            
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Completion Type</label>
                <select
                  value={formData.completionType}
                  onChange={(e) => handleInputChange('completionType', e.target.value as TaskCompletionType)}
                >
                  <option value={TaskCompletionType.APPLICATION_BASED}>Application Based</option>
                  <option value={TaskCompletionType.PROOF_BASED}>Proof Based</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Location Type</label>
                <select
                  value={formData.locationType}
                  onChange={(e) => handleInputChange('locationType', e.target.value as TaskLocationType)}
                >
                  <option value={TaskLocationType.REMOTE}>Remote</option>
                  <option value={TaskLocationType.ONSITE}>On-site</option>
                  <option value={TaskLocationType.HYBRID}>Hybrid</option>
                </select>
              </div>
            </div>

            {formData.locationType !== TaskLocationType.REMOTE && (
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.locationCity}
                    onChange={(e) => handleInputChange('locationCity', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className={styles.field}>
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.locationCountry}
                    onChange={(e) => handleInputChange('locationCountry', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label>Language</label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
              </select>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Media</h3>
            
            <div className={styles.field}>
              <label>Upload Images or Videos</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className={styles.fileInput}
              />
              <small>Maximum {FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB per file. Supported formats: Images (JPG, PNG, GIF) and Videos (MP4, MOV, AVI)</small>
            </div>

            {mediaFiles.length > 0 && (
              <div className={styles.mediaPreview}>
                {mediaFiles.map((media, index) => (
                  <div key={index} className={styles.mediaItem}>
                    {media.type === 'image' ? (
                      <img src={media.preview} alt={`Preview ${index + 1}`} />
                    ) : (
                      <video src={media.preview} controls />
                    )}
                    <div className={styles.mediaInfo}>
                      <span>{media.file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className={styles.removeMedia}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3>Payment</h3>
            
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentAmount}
                  onChange={(e) => handleInputChange('paymentAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.field}>
                <label>Currency</label>
                <select
                  value={formData.paymentCurrency}
                  onChange={(e) => handleInputChange('paymentCurrency', e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Payout Methods</label>
              <div className={styles.checkboxGroup}>
                {Object.values(PayoutMethod).map(method => (
                  <label key={method} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.supportedPayoutMethods.includes(method)}
                      onChange={() => handlePayoutMethodToggle(method)}
                    />
                    {method.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Additional Details</h3>
            
            <div className={styles.field}>
              <label>Grading Method</label>
              <select
                value={formData.gradingMethod}
                onChange={(e) => handleInputChange('gradingMethod', e.target.value as GradingMethod)}
              >
                <option value={GradingMethod.CREATOR_ONLY}>Creator Only</option>
                <option value={GradingMethod.COMMUNITY_VOTING}>Community Voting</option>
                <option value={GradingMethod.BOTH}>Both</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Submission Instructions</label>
              <textarea
                value={formData.submissionInstructions}
                onChange={(e) => handleInputChange('submissionInstructions', e.target.value)}
                placeholder="How should applicants submit their work?"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Tags</label>
              <div className={styles.tagInput}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag}>Add</Button>
              </div>
              <div className={styles.tags}>
                {formData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePublicTaskModal; 