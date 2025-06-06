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

    // Reset user membership to FREE
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        membership_type: 'FREE',
        membership_expires_at: null
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reset membership', details: updateError }, { status: 500 });
    }

    // Also update any active subscriptions to canceled (for testing)
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date(),
        updated_at: new Date()
      })
      .eq('user_id', user.id)
      .neq('status', 'canceled');

    return NextResponse.json({
      success: true,
      message: 'Membership reset to FREE',
      userId: user.id,
      newMembership: 'FREE',
      note: 'This is for testing only - in production, membership changes should come from Stripe webhooks'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 