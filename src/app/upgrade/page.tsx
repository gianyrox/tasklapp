'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { SubscriptionPlan } from '../../types';
import styles from './Upgrade.module.css';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'member',
    name: 'Member',
    description: 'Upgrade to unlock collaborative features',
    price: 200, // $2.00 in cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
    stripeProductId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID || '',
    features: [
      'All free features',
      'Create tasks for multiple friends at once',
      'Priority support',
      'Advanced task sharing'
    ],
    popular: true
  }
];

export default function UpgradePage() {
  const { user, getCurrentSession } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user || user?.membershipType === 'PREMIUM') return;
    
    setLoading(plan.id);
    try {
      // Get the current session for authorization
      const session = await getCurrentSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { clientSecret } = await response.json();
      
      // Redirect to Stripe checkout
      if (clientSecret) {
        // For now, we'll redirect to a payment page
        // In a real implementation, you'd integrate with Stripe Elements
        window.location.href = `/upgrade/checkout?client_secret=${clientSecret}`;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AppLayout>
      <div className={styles.upgradeContainer}>
        <div className={styles.header}>
          <h1>Become a Member</h1>
          <p>Unlock collaborative features and create tasks for multiple friends at once</p>
        </div>

        <div className={styles.plansGrid}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div 
              key={plan.id} 
              className={`${styles.planCard} ${plan.popular ? styles.popular : ''} ${user?.membershipType === 'PREMIUM' ? styles.current : ''}`}
            >
              {plan.popular && <div className={styles.popularBadge}>Recommended</div>}
              {user?.membershipType === 'PREMIUM' && (
                <div className={styles.currentBadge}>Current Plan</div>
              )}
              
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <p className={styles.description}>{plan.description}</p>
                <div className={styles.price}>
                  <span className={styles.amount}>{formatPrice(plan.price, plan.currency)}</span>
                  <span className={styles.interval}>/{plan.interval}</span>
                </div>
              </div>

              <ul className={styles.features}>
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.planButton} ${styles.premium}`}
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id || user?.membershipType === 'PREMIUM'}
              >
                {loading === plan.id ? (
                  'Processing...'
                ) : user?.membershipType === 'PREMIUM' ? (
                  'Current Plan'
                ) : (
                  'Become a Member'
                )}
              </button>
            </div>
          ))}
        </div>

        {user?.membershipType === 'PREMIUM' && (
          <div className={styles.managementSection}>
            <h2>Manage Your Membership</h2>
            <p>Need to update your payment method or cancel your membership?</p>
            <button className={styles.manageButton}>
              Manage Billing
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 