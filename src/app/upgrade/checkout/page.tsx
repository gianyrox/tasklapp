'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AppLayout } from '../../../components/layout/AppLayout';
import styles from './Checkout.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/upgrade/success`,
        },
      });

      if (error) {
        setError(error.message || 'An error occurred');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      <div className={styles.header}>
        <h1>Complete Your Subscription</h1>
        <p>You're just one step away from unlocking member features!</p>
      </div>

      <div className={styles.paymentSection}>
        <PaymentElement />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={styles.submitButton}
      >
        {isProcessing ? 'Processing...' : 'Complete Payment'}
      </button>

      <div className={styles.securityInfo}>
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </form>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get('client_secret');

  useEffect(() => {
    if (!clientSecret) {
      router.push('/upgrade');
    }
  }, [clientSecret, router]);

  if (!clientSecret) {
    return (
      <div className={styles.loading}>
        <p>Redirecting...</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#374151',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className={styles.checkoutContainer}>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className={styles.loading}>
          <p>Loading checkout...</p>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </AppLayout>
  );
} 