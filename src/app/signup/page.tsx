'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/api/supabase';
import Link from 'next/link';
import styles from '../login/Login.module.css';
import Button from '../../components/ui/Button';
import { addLog } from '../../lib/logging';
import { LogCategory } from '../../../confy/types';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name' });
      setIsSubmitting(false);
      return;
    }

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Log signup attempt
      const emailPrefix = email.substring(0, email.indexOf('@'));
      const emailDomain = email.substring(email.indexOf('@') + 1);
      const redactedEmail = `${emailPrefix.substring(0, Math.min(3, emailPrefix.length))}***@${emailDomain}`;
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'signup_attempt',
        details: { 
          redactedEmail,
          hasName: Boolean(name.trim()),
          timestamp: new Date().toISOString()
        }
      });

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      await addLog({
        category: LogCategory.AUTH,
        action: 'signup_otp_sent',
        details: { 
          redactedEmail,
          timestamp: new Date().toISOString()
        }
      });

      setMessage({ 
        type: 'success', 
        text: 'Check your email for the 6-digit verification code!' 
      });
      setStep('otp');

      // Track OTP request timestamp
      try {
        sessionStorage.setItem('last_otp_request', Date.now().toString());
      } catch (e) {
        console.error('Error saving to session storage:', e);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'An unexpected error occurred. Please try again.' 
      });

      await addLog({
        category: LogCategory.ERROR,
        action: 'signup_error',
        details: { 
          error: error.message || 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      setIsSubmitting(false);
      return;
    }

    try {
      const emailPrefix = email.substring(0, email.indexOf('@'));
      const emailDomain = email.substring(email.indexOf('@') + 1);
      const redactedEmail = `${emailPrefix.substring(0, Math.min(3, emailPrefix.length))}***@${emailDomain}`;
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'signup_otp_verification_attempt',
        details: { 
          redactedEmail,
          timestamp: new Date().toISOString()
        }
      });

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        console.error('OTP verification error:', error);
        setMessage({ type: 'error', text: error.message || 'Invalid verification code' });
        
        await addLog({
          category: LogCategory.ERROR,
          action: 'signup_otp_verification_error',
          details: { 
            error: error.message,
            redactedEmail,
            timestamp: new Date().toISOString()
          }
        });
        
        return;
      }

      if (data.session) {
        console.log('Signup OTP verification successful');
        setMessage({ type: 'success', text: 'Account created successfully! Redirecting...' });
        
        await addLog({
          userId: data.session.user.id,
          category: LogCategory.AUTH,
          action: 'signup_otp_verification_success',
          details: { 
            redactedEmail,
            timestamp: new Date().toISOString()
          }
        });

        // Redirect to dashboard after successful signup
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error: any) {
      console.error('Unexpected signup verification error:', error);
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
      
      await addLog({
        category: LogCategory.ERROR,
        action: 'signup_otp_verification_exception',
        details: { 
          error: String(error),
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setMessage(null);
  };

  const handleResendOtp = async () => {
    // Check rate limiting
    try {
      const lastRequest = sessionStorage.getItem('last_otp_request');
      if (lastRequest) {
        const lastRequestTime = parseInt(lastRequest, 10);
        const timeSinceLastRequest = Date.now() - lastRequestTime;
        
        if (timeSinceLastRequest < 30000) {
          const secondsToWait = Math.ceil((30000 - timeSinceLastRequest) / 1000);
          setMessage({ 
            type: 'error', 
            text: `Please wait ${secondsToWait} seconds before requesting another code.` 
          });
          return;
        }
      }
    } catch (e) {
      console.error('Error checking rate limit:', e);
    }

    setIsSubmitting(true);
    setMessage({ type: 'info', text: 'Sending new verification code...' });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to send new code' });
      } else {
        setMessage({ type: 'success', text: 'New verification code sent!' });
        sessionStorage.setItem('last_otp_request', Date.now().toString());
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to send new code' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            Taskl
          </Link>
          <h1>Create an account</h1>
          {step === 'email' ? (
            <p>Join Taskl and start managing your tasks more efficiently</p>
          ) : (
            <p>Enter the 6-digit code sent to {email}</p>
          )}
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="otp" className={styles.label}>
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${styles.input} ${styles.otpInput}`}
                disabled={isSubmitting}
                maxLength={6}
                required
                autoComplete="one-time-code"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting || otp.length !== 6}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className={styles.otpActions}>
              <button
                type="button"
                onClick={handleBackToEmail}
                className={styles.linkButton}
                disabled={isSubmitting}
              >
                ← Change details
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className={styles.linkButton}
                disabled={isSubmitting}
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 