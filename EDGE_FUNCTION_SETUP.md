# Task Assignment Email Notification Setup

This guide will help you set up the Supabase Edge Function for sending email notifications when users are assigned tasks.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Resend Account**: Sign up at [resend.com](https://resend.com) for email delivery
3. **Supabase CLI**: Install the Supabase CLI for deploying edge functions

## Setup Steps

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project reference in your Supabase dashboard URL.

### 4. Set Up Resend

1. Sign up for a [Resend account](https://resend.com)
2. Get your API key from the Resend dashboard
3. Verify your sending domain (or use their sandbox domain for testing)

### 5. Configure Environment Variables

In your Supabase project dashboard:

1. Go to **Settings** → **Edge Functions** → **Environment Variables**
2. Add the following variables:

```
RESEND_API_KEY=your_resend_api_key_here
APP_URL=https://your-app-domain.com
```

For local development, also add to your `.env.local`:

```
RESEND_API_KEY=your_resend_api_key_here
APP_URL=http://localhost:3000
```

### 6. Deploy the Edge Function

```bash
supabase functions deploy notify-task-assignment
```

### 7. Test the Function

You can test the function using curl:

```bash
curl -X POST \
  'https://xgfdypewsviakeabgvm.supabase.co/functions/v1/notify-task-assignment' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmR5cGV3c3ZpYWtlYWJndm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTMyMTMsImV4cCI6MjA2MDMyOTIxM30.XqJQbIey99IUpqryrikFPCUAftDpPEj4XO3UnPgqDcA' \
  -H 'Content-Type: application/json' \
  -d '{
    "assigneeEmail": "test@example.com",
    "assigneeName": "Test User",
    "assignerName": "John Doe",
    "taskTitle": "Test Task",
    "taskDescription": "This is a test task",
    "dueDate": "2024-02-01T12:00:00Z",
    "taskId": "123"
  }'
```

## Customization

### Email Template

The email template is defined in the edge function. To customize:

1. Edit `supabase/functions/notify-task-assignment/index.ts`
2. Modify the HTML template in the `html` variable
3. Redeploy with `supabase functions deploy notify-task-assignment`

### Sender Email

Update the `from` field in the edge function:

```typescript
from: 'TaskLapp <notifications@your-verified-domain.com>',
```

**Important**: The domain must be verified in your Resend account.

## How It Works

1. When a task is created and assigned to someone other than the creator
2. The `createTask` function automatically calls the edge function
3. The edge function formats a beautiful HTML email
4. Resend delivers the email to the assignee
5. The email includes task details and a link to view the task

## Error Handling

- If email sending fails, the task creation still succeeds
- Errors are logged to the console for debugging
- The system gracefully handles missing user data

## Local Development

For local development with Supabase functions:

1. Start Supabase locally:
```bash
supabase start
```

2. Serve functions locally:
```bash
supabase functions serve notify-task-assignment
```

3. The function will be available at:
```
http://localhost:54321/functions/v1/notify-task-assignment
```

## Troubleshooting

### Common Issues

1. **"Missing required fields" error**: Ensure all required fields are passed to the function
2. **Email not sending**: Check your Resend API key and domain verification
3. **Function not found**: Ensure the function is deployed correctly
4. **CORS errors**: The function includes proper CORS headers for browser requests

### Debugging

Check the Supabase Edge Function logs:

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions** → **notify-task-assignment**
3. Check the **Invocations** and **Logs** tabs

### Support

If you need help:
1. Check the Supabase documentation on Edge Functions
2. Review the Resend API documentation
3. Check the function logs for specific error messages

## Security Notes

- Never commit your Resend API key to version control
- Use environment variables for all sensitive configuration
- The edge function validates required fields before processing
- Email content is escaped to prevent XSS attacks 