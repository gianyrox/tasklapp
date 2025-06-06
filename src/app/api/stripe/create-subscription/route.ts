import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();
    
    // Get the user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // You'll need to implement proper auth token verification here
    // For now, let's assume we get the user ID from the token
    const userId = await getUserIdFromAuth(authHeader);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(userId);
    
    // Create the subscription with incomplete status
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription' 
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in our database
    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        stripe_product_id: priceId.startsWith('price_') ? '' : priceId, // You may need to get this from the price
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
      });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserIdFromAuth(authHeader: string): Promise<string | null> {
  // Implementation depends on your auth system
  // For Supabase auth, you'd verify the JWT token here
  // This is a placeholder - you'll need to implement proper token verification
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id || null;
  } catch {
    return null;
  }
}

async function getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
  // First, check if user already has a Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, email, name')
    .eq('id', userId)
    .single();

  if (user?.stripe_customer_id) {
    // Return existing customer
    return await stripe.customers.retrieve(user.stripe_customer_id) as Stripe.Customer;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: user?.email,
    name: user?.name,
    metadata: {
      userId: userId,
    },
  });

  // Update user with customer ID
  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer;
} 