import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

    // Get user's active or incomplete subscription (with payment)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'incomplete'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions', details: subError }, { status: 500 });
    }

    const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

    if (!subscription) {
      return NextResponse.json({ 
        message: 'No active or incomplete subscription found',
        action: 'Setting membership to FREE'
      });
    }

    // For incomplete subscriptions, we'll still grant MEMBER access if they have a period end date
    // This indicates payment was processed even if the subscription setup isn't fully complete
    const shouldGrantMEMBER = subscription.status === 'active' || 
                              (subscription.status === 'incomplete' && subscription.current_period_end);

    if (!shouldGrantMEMBER) {
      return NextResponse.json({ 
        message: 'Subscription found but not eligible for MEMBER access',
        subscriptionStatus: subscription.status,
        action: 'No changes made'
      });
    }

    // Update user membership based on subscription
    const membershipType = 'MEMBER';
    const membershipExpiresAt = new Date(subscription.current_period_end);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        membership_type: membershipType,
        membership_expires_at: membershipExpiresAt
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update membership', details: updateError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Membership fixed!',
      userId: user.id,
      previousMembership: 'FREE',
      newMembership: membershipType,
      expiresAt: membershipExpiresAt,
      subscriptionId: subscription.stripe_subscription_id,
      subscriptionStatus: subscription.status,
      note: subscription.status === 'incomplete' ? 'Granted MEMBER access for incomplete subscription with valid period end' : 'Normal active subscription'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 