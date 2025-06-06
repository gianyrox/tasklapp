import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: userError,
        userId: user.id 
      }, { status: 500 });
    }

    // Check if subscriptions table exists and get user's subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    // Get the most recent subscription
    const latestSubscription = subscriptions && subscriptions.length > 0 
      ? subscriptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null;

    // Check if user should be premium based on subscription status
    const shouldBePremium = latestSubscription && (
      latestSubscription.status === 'active' || 
      (latestSubscription.status === 'incomplete' && latestSubscription.current_period_end)
    );

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      userData,
      subscriptions: subError ? null : subscriptions,
      latestSubscription,
      subscriptionError: subError ? subError.message : null,
      hasMembershipColumns: {
        membership_type: 'membership_type' in (userData || {}),
        stripe_customer_id: 'stripe_customer_id' in (userData || {}),
        membership_expires_at: 'membership_expires_at' in (userData || {})
      },
      shouldBePremium,
      membershipMismatch: shouldBePremium && userData?.membership_type !== 'PREMIUM'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 