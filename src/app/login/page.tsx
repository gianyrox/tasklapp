'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './Login.module.css';
import Button from '../../components/ui/Button';
import { addLog } from '../../lib/logging';
import { LogCategory } from '../../../confy/types';
import { supabase } from '../../lib/api/supabase';

// Create a client component that uses the searchParams
const LoginContent: React.FC = () => {
  console.log('Rendering LoginContent component');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const { signIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const refresh = searchParams.get('refresh') === 'true';
  const errorParam = searchParams.get('error');

  console.log('Initial state:', { redirect, refresh, errorParam, hasUser: !!user });

  useEffect(() => {
    console.log('Running initial useEffect for params check');
    // If a refresh was requested (from cookie issue detection)
    if (refresh) {
      console.log('Refresh requested, logging event');
      addLog({
        category: LogCategory.AUTH,
        action: 'login_page_refresh_requested',
        details: { 
          redirect,
          hasCookies: document.cookie.length > 0
        }
      });
    }

    // Log redirect parameter if present and not the default
    if (redirect && redirect !== '/dashboard') {
      console.log(`Non-default redirect detected: ${redirect}`);
      addLog({
        category: LogCategory.AUTH,
        action: 'login_page_redirect_param',
        details: { 
          redirect,
          referrer: document.referrer,
          fromAuth: document.referrer.includes('/auth/callback')
        }
      });
    }

    // Check if we need to retry authentication after a failure
    const retryAuth = searchParams.get('retry');
    if (retryAuth) {
      const retryCount = parseInt(retryAuth, 10) || 1;
      const maxRetries = 3;
      
      console.log(`Auth retry attempt ${retryCount}/${maxRetries}`);
      
      if (retryCount <= maxRetries) {
        // Add log for retry attempt
        addLog({
          category: LogCategory.AUTH,
          action: 'login_auth_retry',
          details: { 
            retryCount,
            maxRetries,
            redirect,
            error: errorParam
          }
        });
        
        // If we have user info in sessionStorage, attempt to verify session
        try {
          const sessionCheck = async () => {
            console.log('Checking for existing session');
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
              console.log('Valid session found, redirecting to', redirect);
              // We have a valid session, redirect to dashboard
              window.location.href = redirect;
              return;
            }
            
            console.log('No session found, showing retry message');
            // No session found but we're retrying, show retry message
            setMessage({
              type: 'info',
              text: `Attempting to restore your session (${retryCount}/${maxRetries})...`
            });
            
            // Wait 2 seconds and refresh page with incremented retry count
            console.log('Setting timeout for next retry attempt');
            setTimeout(() => {
              const url = new URL(window.location.href);
              url.searchParams.set('retry', (retryCount + 1).toString());
              console.log('Redirecting to next retry URL:', url.toString());
              window.location.href = url.toString();
            }, 2000);
          };
          
          sessionCheck();
        } catch (e) {
          console.error('Error during auth retry:', e);
          
          addLog({
            category: LogCategory.ERROR,
            action: 'login_auth_retry_error',
            details: { error: String(e) }
          });
        }
      } else {
        console.log('Max retries reached, showing error message');
        // Max retries reached
        setMessage({
          type: 'error',
          text: 'Authentication failed after multiple attempts. Please try logging in again.'
        });
        
        addLog({
          category: LogCategory.ERROR,
          action: 'login_auth_retry_max_reached',
          details: { 
            retryCount,
            maxRetries,
            redirect
          }
        });
      }
    }

    // Check for error parameter
    if (errorParam) {
      console.log(`Error parameter detected: ${errorParam}`);
      const errorMessage = searchParams.get('message') || 
        (errorParam === 'callback_error' 
          ? 'Authentication failed. Please try again.' 
          : errorParam === 'no_auth_code'
            ? 'Missing authentication code. Please try again.'
            : errorParam === 'no_session'
              ? 'Unable to establish a session. Please try again.'
              : 'An error occurred during login.');
              
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      
      addLog({
        category: LogCategory.ERROR,
        action: 'login_page_error_param',
        details: { 
          error: errorParam,
          message: errorMessage
        }
      });
    }
  }, [refresh, searchParams, redirect, errorParam]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    console.log('Running user redirect useEffect, user:', user ? 'exists' : 'null');
    const handleUserRedirect = async () => {
      if (user) {
        console.log('User is logged in, preparing redirect');
        // Check if cookies are properly set
        const hasAuthCookie = document.cookie.includes('supabase-auth');
        console.log('Auth cookie present:', hasAuthCookie);
        
        await addLog({
          category: LogCategory.AUTH,
          action: 'login_page_user_redirect',
          details: { 
            redirect,
            hasCookies: hasAuthCookie
          }
        });
        
        // Explicitly verify session before redirecting
        console.log('Verifying session before redirect');
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('Valid session confirmed, redirecting to', redirect);
          
          // Use window.location for a full page load to ensure cookies are applied
          if (redirect.startsWith('/')) {
            console.log('Redirecting to internal path:', redirect);
            window.location.href = redirect;
          } else {
            // Safety check for external URLs
            console.log('Redirect not starting with /, defaulting to /dashboard');
            window.location.href = '/dashboard';
          }
        } else {
          // If we have a user object but no valid session, we have an inconsistent state
          console.error('User object exists but no valid session found');
          
          // Clear any potential corrupt auth state
          console.log('Clearing localStorage auth token');
          localStorage.removeItem('supabase.auth.token');
          
          // Force reload the page to reset the auth state
          console.log('Reloading page to reset auth state');
          window.location.reload();
        }
      }
    };
    
    handleUserRedirect();
  }, [user, redirect]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    console.log('Email form submitted');
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!email || !email.includes('@')) {
      console.log('Invalid email format:', email);
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setIsSubmitting(false);
      
      await addLog({
        category: LogCategory.ERROR,
        action: 'login_invalid_email',
        details: { 
          hasEmail: Boolean(email),
          isValidFormat: Boolean(email?.includes('@')),
          timestamp: new Date().toISOString()
        }
      });
      
      return;
    }

    try {
      console.log('Processing valid email submission');
      // Log the login attempt with redacted email for privacy
      const emailPrefix = email.substring(0, email.indexOf('@'));
      const emailDomain = email.substring(email.indexOf('@') + 1);
      const redactedEmail = `${emailPrefix.substring(0, Math.min(3, emailPrefix.length))}***@${emailDomain}`;
      console.log('Redacted email for logging:', redactedEmail);
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'login_attempt',
        details: { 
          redactedEmail,
          hasRedirect: Boolean(redirect !== '/dashboard'),
          redirectPath: redirect === '/dashboard' ? null : redirect,
          timestamp: new Date().toISOString(),
          loginMethod: 'otp',
          userAgent: navigator.userAgent
        }
      });
      
      // Notify user we're sending the OTP
      console.log('Updating UI to show sending status');
      setMessage({ type: 'success', text: 'Sending verification code...' });
      
      // Call the signIn function to send the OTP
      console.log('Calling signIn function');
      const { success, error } = await signIn(email);

      if (success) {
        console.log('OTP sent successfully');
        setMessage({ 
          type: 'success', 
          text: 'Check your email for the 6-digit verification code!' 
        });
        setStep('otp');
        
        await addLog({
          category: LogCategory.AUTH,
          action: 'otp_sent',
          details: { 
            redactedEmail,
            hasRedirect: Boolean(redirect !== '/dashboard'),
            redirectPath: redirect === '/dashboard' ? null : redirect,
            timestamp: new Date().toISOString()
          }
        });
        
        // Track OTP request timestamp to prevent too many requests
        try {
          console.log('Saving OTP request timestamp');
          sessionStorage.setItem('last_otp_request', Date.now().toString());
        } catch (e) {
          console.error('Error saving to session storage:', e);
        }
      } else {
        console.error('Error sending OTP:', error);
        setMessage({ type: 'error', text: error || 'An error occurred' });
        
        await addLog({
          category: LogCategory.ERROR,
          action: 'otp_error',
          details: { 
            error: error || 'Unknown error',
            redactedEmail,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
      
      await addLog({
        category: LogCategory.ERROR,
        action: 'login_exception',
        details: { 
          error: String(error),
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      console.log('Email submission complete, resetting isSubmitting');
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    console.log('OTP form submitted');
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      console.log('Invalid OTP format:', otp);
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Verifying OTP');
      
      const emailPrefix = email.substring(0, email.indexOf('@'));
      const emailDomain = email.substring(email.indexOf('@') + 1);
      const redactedEmail = `${emailPrefix.substring(0, Math.min(3, emailPrefix.length))}***@${emailDomain}`;
      
      await addLog({
        category: LogCategory.AUTH,
        action: 'otp_verification_attempt',
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
          action: 'otp_verification_error',
          details: { 
            error: error.message,
            redactedEmail,
            timestamp: new Date().toISOString()
          }
        });
        
        return;
      }

      if (data.session) {
        console.log('OTP verification successful');
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        
        await addLog({
          userId: data.session.user.id,
          category: LogCategory.AUTH,
          action: 'otp_verification_success',
          details: { 
            redactedEmail,
            redirectTo: redirect,
            timestamp: new Date().toISOString()
          }
        });

        // Redirect after successful verification
        setTimeout(() => {
          window.location.href = redirect;
        }, 1000);
      }
    } catch (error) {
      console.error('Unexpected OTP verification error:', error);
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      });
      
      await addLog({
        category: LogCategory.ERROR,
        action: 'otp_verification_exception',
        details: { 
          error: String(error),
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      console.log('OTP submission complete, resetting isSubmitting');
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

    const { success, error } = await signIn(email);
    
    if (success) {
      setMessage({ type: 'success', text: 'New verification code sent!' });
      sessionStorage.setItem('last_otp_request', Date.now().toString());
    } else {
      setMessage({ type: 'error', text: error || 'Failed to send new code' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            TasklApp
          </Link>
          <h1>Log in to your account</h1>
          {step === 'email' ? (
            <p>Enter your email to receive a verification code</p>
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
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className={styles.otpActions}>
              <button
                type="button"
                onClick={handleBackToEmail}
                className={styles.linkButton}
                disabled={isSubmitting}
              >
                ← Change email
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
            Don't have an account?{' '}
            <Link href="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Fallback component to display while loading
const LoginFallback: React.FC = () => {
  console.log('Rendering LoginFallback component');
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>TasklApp</span>
          <h1>Log in to your account</h1>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  );
};

// Main page component that wraps the LoginContent with Suspense
const LoginPage: React.FC = () => {
  console.log('Rendering LoginPage component');
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage; 