# Testing the Task App

This guide provides instructions for testing the friend-based task application. Follow these steps to set up your testing environment and verify the functionality.

## Setting Up for Testing

### 1. Configure Supabase

1. Log in to your [Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor section
4. Run the schema setup script:
   - Open `src/database/schema.sql`
   - Run the SQL script to create all tables, functions, and policies

### 2. Generate Test Data

1. In the Supabase SQL Editor, create a new query
2. Open `src/database/seed_data.sql`
3. Run the script to populate your database with test users, friendships, and tasks
4. The script will output the UUIDs for the generated users in the console

### 3. Set Up Authentication

For local testing with mock users:

1. Go to Authentication > Users in your Supabase dashboard
2. Find Alice Johnson's user record (created by the seed script)
3. Click "Copy UUID"
4. Update your `.env.local` file with a test user override:
   ```
   NEXT_PUBLIC_TEST_USER_ID=paste-the-copied-uuid-here
   ```

## Testing Features

### Dashboard Testing

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/dashboard
3. Verify that the following components are displayed:
   - "My Tasks (Assigned by Friends)" section showing tasks from Bob and Carol
   - Friend task lists for Bob and Carol
   - Leaderboard showing rankings

### Task Management Testing

1. Task Status Changes:
   - Find a task in the "My Tasks" section
   - Click the "Start" button to change the status to IN_PROGRESS
   - Verify the task moves to the appropriate section
   - Click the "Complete" button to mark as COMPLETED
   - Verify the task is updated with completion data

2. Friend Task List:
   - Verify each friend has their own task list
   - Check that the tasks you assigned to them are displayed
   - Verify empty states show correctly for friends with no tasks

### Friendship Testing

1. Pending Friendship Requests:
   - Navigate to the Friends page
   - Verify you can see incoming friend requests
   - Accept or decline a request and confirm the status changes

2. Adding Friends:
   - Search for users
   - Send friend requests
   - Verify the request appears in the pending section

## Testing Authentication

If you are using magic link authentication:

1. Navigate to the login page
2. Enter a test email address
3. Go to your Supabase dashboard > Authentication > Users
4. Find the user and click on them
5. In the Auth section, you'll see a list of emails sent
6. Copy the magic link and open it in your browser

## Testing the API Directly

You can test the APIs directly using the Supabase dashboard:

1. Go to your Supabase dashboard > API
2. Use the API documentation to make test requests
3. Verify the responses match expected data

## End-to-End Testing Scenarios

### Scenario 1: Complete Task Workflow

1. Log in as Alice
2. View tasks assigned by Bob
3. Start the "Review presentation slides" task
4. Click "Complete"
5. Add time took (40 minutes)
6. Log out
7. Log in as Bob
8. Verify the task is completed
9. Add a quality rating (4/5) and feedback
10. Check that the task appears in completion history

### Scenario 2: Friend Request Cycle

1. Log in as David
2. Send a friend request to Alice
3. Log out
4. Log in as Alice
5. Accept the friend request
6. Verify David appears in friends list
7. Assign a new task to David
8. Log out
9. Log in as David
10. Verify the new task appears in his dashboard

## Running Automated Tests

If you have set up unit or integration tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- TaskList.test.tsx
```

## Common Issues and Solutions

### Authentication Issues

- **Problem**: Magic links not working
- **Solution**: Check SMTP settings in Supabase dashboard

### Database Issues

- **Problem**: Permission denied errors
- **Solution**: Verify your RLS policies are set up correctly

### Testing in Different Environments

- **Development**: `.env.local` - Use test user overrides
- **Testing**: `.env.test` - Use separate test database
- **Production**: Remove all test user overrides

## Reporting Bugs

When you find issues during testing:

1. Take a screenshot
2. Note the steps to reproduce
3. Check browser console for errors
4. Create an issue in the project repository with these details 