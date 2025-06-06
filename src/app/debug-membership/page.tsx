'use client';

import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

export default function DebugMembershipPage() {
  const { user, getCurrentSession } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  const loadDebugData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const session = await getCurrentSession();
      const response = await fetch('/api/debug/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixMembership = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const session = await getCurrentSession();
      const response = await fetch('/api/debug/fix-membership', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      setFixResult(result);
      
      if (result.success) {
        // Clear cache and reload after a short delay
        setTimeout(() => {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('user_')) {
              sessionStorage.removeItem(key);
            }
          });
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error) {
      console.error('Error fixing membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetMembership = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const session = await getCurrentSession();
      const response = await fetch('/api/debug/reset-membership', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      setFixResult(result);
      
      if (result.success) {
        // Clear cache and reload after a short delay
        setTimeout(() => {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('user_')) {
              sessionStorage.removeItem(key);
            }
          });
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error) {
      console.error('Error resetting membership:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, [user]);

  if (!user) {
    return <div className="p-8">Please log in to debug membership.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Membership Debug</h1>
      
      {loading && <div className="text-blue-600">Loading...</div>}
      
      {debugData && (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>User ID:</strong> {debugData.userId}
              </div>
              <div>
                <strong>Email:</strong> {debugData.userEmail}
              </div>
              <div>
                <strong>Membership Type:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  debugData.userData?.membership_type === 'PREMIUM' 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  {debugData.userData?.membership_type || 'Unknown'}
                </span>
              </div>
              <div>
                <strong>Stripe Customer ID:</strong> {debugData.userData?.stripe_customer_id || 'None'}
              </div>
            </div>
          </div>

          {debugData.latestSubscription && (
            <div className="bg-blue-50 p-4 rounded">
              <h2 className="text-xl font-semibold mb-4">Latest Subscription</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    debugData.latestSubscription.status === 'active' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {debugData.latestSubscription.status}
                  </span>
                </div>
                <div>
                  <strong>Stripe ID:</strong> {debugData.latestSubscription.stripe_subscription_id}
                </div>
                <div>
                  <strong>Current Period End:</strong> {new Date(debugData.latestSubscription.current_period_end).toLocaleDateString()}
                </div>
                <div>
                  <strong>Product ID:</strong> {debugData.latestSubscription.stripe_product_id}
                </div>
              </div>
            </div>
          )}

          {debugData.membershipMismatch && (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h2 className="text-xl font-semibold mb-4 text-red-800">⚠️ Membership Mismatch Detected!</h2>
              <p className="mb-4 text-red-700">
                You have an active subscription but your membership type is still FREE. 
                This needs to be fixed.
              </p>
              <button 
                onClick={fixMembership}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Fixing...' : 'Fix Membership'}
              </button>
            </div>
          )}

          {debugData.shouldBePremium && !debugData.membershipMismatch && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h2 className="text-xl font-semibold mb-4 text-green-800">✅ Everything looks good!</h2>
              <p className="text-green-700">Your membership status matches your subscription.</p>
            </div>
          )}

          {fixResult && (
            <div className={`p-4 rounded ${
              fixResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h2 className="text-xl font-semibold mb-4">Fix Result</h2>
              <pre className="text-sm">{JSON.stringify(fixResult, null, 2)}</pre>
              {fixResult.success && (
                <p className="mt-4 text-green-700">
                  ✅ Success! Redirecting to dashboard in 2 seconds...
                </p>
              )}
            </div>
          )}

          <button 
            onClick={loadDebugData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Debug Data'}
          </button>

          <button 
            onClick={resetMembership}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset to FREE (Testing)'}
          </button>
        </div>
      )}
    </div>
  );
} 