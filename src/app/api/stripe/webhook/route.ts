import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Webhook signature verified, event type:', event.type);
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    console.log('🔄 Processing webhook event:', event.type, 'ID:', event.id);
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('📝 Processing subscription update/creation');
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        console.log('❌ Processing subscription deletion');
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('💰 Processing successful payment');
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        console.log('💥 Processing failed payment');
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  console.log('🔍 Handling subscription update for customer:', customerId);
  console.log('📊 Subscription details:', {
    id: subscription.id,
    status: subscription.status,
    current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
    current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : null,
    product: subscription.items.data[0].price.product,
    price: subscription.items.data[0].price.id
  });
  
  // Get user ID from customer
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !user) {
    console.error('❌ User not found for customer:', customerId, 'Error:', userError);
    return;
  }

  console.log('👤 Found user:', user.id, user.email);

  // Update or insert subscription
  const subscriptionData = {
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    stripe_product_id: subscription.items.data[0].price.product as string,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : new Date(),
    current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
    updated_at: new Date(),
  };

  console.log('💾 Updating subscription table with data:', subscriptionData);

  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id'
    });

  if (subscriptionError) {
    console.error('❌ Error updating subscription:', subscriptionError);
    return;
  }

  console.log('✅ Subscription table updated successfully');

  // Update user membership type
  const membershipType = (subscription.status === 'active' || 
                         (subscription.status === 'incomplete' && (subscription as any).latest_invoice)) 
                         ? 'MEMBER' : 'FREE';
  const membershipExpiresAt = (subscription.status === 'active' || 
                              (subscription.status === 'incomplete' && (subscription as any).latest_invoice))
    ? ((subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    : null;

  console.log('👤 Updating user membership:', {
    userId: user.id,
    membershipType,
    membershipExpiresAt,
    subscriptionStatus: subscription.status
  });

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ 
      membership_type: membershipType,
      membership_expires_at: membershipExpiresAt
    })
    .eq('id', user.id);

  if (userUpdateError) {
    console.error('❌ Error updating user membership:', userUpdateError);
    return;
  }

  console.log('✅ User membership updated successfully to:', membershipType);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Get user ID from customer
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: new Date(),
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user membership
  await supabase
    .from('users')
    .update({ 
      membership_type: 'FREE',
      membership_expires_at: null
    })
    .eq('id', user.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    const customerId = invoice.customer as string;
    
    // Get user ID from customer
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', (invoice as any).subscription)
      .single();

    // Record payment in payment history
    await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        subscription_id: subscription?.id,
        stripe_payment_intent_id: typeof (invoice as any).payment_intent === 'string' ? (invoice as any).payment_intent : (invoice as any).payment_intent?.id,
        amount: (invoice as any).amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method_type: (invoice as any).charge ? 'card' : 'unknown', // You might want to get more specific info
      });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    const customerId = invoice.customer as string;
    
    // Get user ID from customer
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!user) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', (invoice as any).subscription)
      .single();

    // Record failed payment
    await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        subscription_id: subscription?.id,
        stripe_payment_intent_id: typeof (invoice as any).payment_intent === 'string' ? (invoice as any).payment_intent : (invoice as any).payment_intent?.id,
        amount: (invoice as any).amount_due,
        currency: invoice.currency,
        status: 'requires_payment_method',
      });
  }
} 