'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/api/supabase';
import Link from 'next/link';
import styles from '../login/Login.module.css';
import Button from '../../components/ui/Button';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signUp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
          data: {
            name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      setMessage({ 
        type: 'success', 
        text: 'Check your email for the confirmation link to complete your registration!' 
      });
      setEmail('');
      setName('');
    } catch (error: any) {
      console.error('Signup error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            Taskl
          </Link>
          <h1>Create an account</h1>
          <p>Join Taskl and start managing your tasks more efficiently</p>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

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