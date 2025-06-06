# Membership System Setup

This guide will help you set up the membership system with Stripe integration for your task app.

## Prerequisites

1. A Stripe account (test mode for development)
2. Supabase project with the database schema updated
3. Node.js environment with all dependencies installed

## 1. Database Setup

Run the membership migration to add the required tables and columns:

```sql
-- Run this SQL in your Supabase SQL editor
-- Or run the migration file: src/database/membership_migration.sql
```

This adds:
- `membership_type` and `stripe_customer_id` columns to `users` table
- `subscriptions` table for tracking Stripe subscriptions
- `payment_history` table for payment records
- Helper functions for membership checks

## 2. Stripe Setup

### 2.1 Create Products and Prices in Stripe

1. Go to your Stripe Dashboard → Products
2. Create a "Premium" product
3. Add a price (e.g., $9.99/month) to the product
4. Copy the Price ID (starts with `price_`) and Product ID (starts with `prod_`)

### 2.2 Set up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Create a new webhook endpoint pointing to: `https://your-domain.com/api/stripe/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (starts with `whsec_`)

## 3. Environment Variables

Add these variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
NEXT_PUBLIC_STRIPE_PREMIUM_PRODUCT_ID=prod_your_premium_product_id

# Supabase Service Role Key (for webhook access)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 4. Testing the Integration

### 4.1 Test Subscription Flow

1. Navigate to `/upgrade` in your app
2. Click "Upgrade Now" on the Premium plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete the payment flow
5. Verify the user's membership is updated in the database

### 4.2 Test Webhook Events

Use Stripe CLI to forward webhooks to your local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Or test specific events:

```bash
stripe trigger customer.subscription.created
```

## 5. Features Added

### Frontend
- `/upgrade` - Subscription plans page
- `/upgrade/checkout` - Payment form with Stripe Elements
- `/upgrade/success` - Success page after payment
- Upgrade button in navigation (desktop and mobile)
- Premium badge for premium users

### Backend
- `/api/stripe/create-subscription` - Creates subscription and payment intent
- `/api/stripe/webhook` - Handles Stripe webhook events
- Database functions for membership checks

### Database
- Membership tracking in `users` table
- Subscription management in `subscriptions` table
- Payment history in `payment_history` table

## 6. Adding Premium Features

To add premium-only features to your app:

1. Check user membership in components:
```typescript
if (user?.membershipType === 'PREMIUM') {
  // Show premium feature
}
```

2. Use database function for server-side checks:
```sql
SELECT is_premium_member('user-id');
```

3. Add premium limits/features in your business logic

## 7. Production Deployment

1. Replace test keys with live Stripe keys
2. Update webhook endpoint URL to production domain
3. Test the complete flow in production environment
4. Monitor webhook deliveries in Stripe Dashboard

## Security Notes

- Never expose your Stripe secret key in client-side code
- Always verify webhook signatures
- Use Row Level Security (RLS) policies in Supabase
- Validate subscription status on both client and server

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**: Check endpoint URL and selected events
2. **Authentication errors**: Verify Supabase service role key
3. **Payment failures**: Check Stripe logs for detailed error messages
4. **Database errors**: Ensure migration ran successfully

### Useful Commands

```bash
# Check Stripe CLI status
stripe status

# Listen for webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger customer.subscription.created
``` 