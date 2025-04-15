# Taskl App

A friend-based task completion application where users can assign tasks to their friends and complete tasks assigned to them. Complete tasks, earn ratings, and compete on the leaderboard.

## Project Overview

The app is built using:
- Next.js framework
- TypeScript for type safety
- CSS for styling (no Tailwind)
- Supabase for backend database

Website URL: https://taskl.app

## Key Features
- Connect with friends and build your network
- Assign tasks to your friends
- Complete tasks assigned by your friends
- Track task performance metrics (time, quality, completion rate)
- Leaderboard to see how you and your friends compare
- View tasks by friend - each friend gets their own task list

## Setup Instructions

### Frontend Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the development server:
   ```
   npm run dev
   ```

### Supabase Backend Setup
1. Create a Supabase account at [supabase.com](https://supabase.com/)
2. Create a new project with your preferred settings
3. Get your API URL and anon key from Settings > API
4. Set up database tables:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Create users, friendships, tasks, and task_attachments tables using the SQL queries in the setup instructions
5. Enable Row Level Security (RLS) with appropriate policies
6. Set up authentication in the Authentication settings
7. Create database triggers and functions for friendship management and leaderboard

### Magic Link Authentication Setup
1. In your Supabase dashboard, go to Authentication > Providers
2. Make sure Email provider is enabled
3. Under Email provider settings:
   - Toggle on "Enable magic links"
   - Customize the email template as needed
4. In Authentication > URL Configuration:
   - Set Site URL to https://taskl.app (for production)
   - Add http://localhost:3000 to Additional Redirect URLs (for development)
5. If configuring a custom SMTP server:
   - Add your SMTP credentials for the taskl.app domain
   - Ensure SPF and DKIM records are properly set up in your Namecheap DNS settings

## Development Prompts

### Initial Setup
- Set up Next.js with TypeScript
- Create component structure (layout, ui, task, user, dashboard)
- Implement global CSS styling
- Create type definitions for users, friends, and tasks

### UI Components
- Button component with different variants and sizes
- Task card component for displaying task information
- Friend list component for displaying and managing connections
- Layout components with responsive design

### Pages
- Dashboard page showing tasks from friends and per-friend task lists
- Home page with features and call-to-action
- Friend management pages
- Task creation and submission pages

### Supabase Integration
- API functions for user, friendship, and task management
- Custom React hooks for data fetching and state management
- Authentication integration

## Database Schema

### Users Table
- Standard user information (id, name, email, etc.)

### Friendships Table
- Tracks connections between users
- Contains status of friendship (pending, accepted, declined)

### Tasks Table
- Core task information (title, description, etc.)
- Assignment data (who assigned to whom)
- Extended metadata:
  - Estimated time
  - Actual completion time
  - Submission date
  - Quality rating (1-5)
  - Feedback text

### Task Attachments
- Allows users to attach files/evidence to task submissions

## Running SQL Queries
To execute SQL queries for database setup:
1. Go to your Supabase project dashboard
2. Select "SQL Editor" from the left sidebar
3. Click "New Query" to create a new SQL query
4. Paste the provided SQL code
5. Click "Run" to execute the query

## Testing Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000 in your browser
3. Click "Sign Up" to create a new account
4. Fill in your name and email address
5. Check your email for the confirmation link
6. After confirming your email, you'll be redirected to the dashboard
7. To log out, click your profile icon and select "Log Out"
8. To log back in, use the "Login" page with your email

### Local Email Testing

If you're testing locally, you can view the magic link emails in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click on your test user
4. In the Auth section, you'll see a list of emails sent
5. Click on the most recent email to view the magic link
6. Copy the link and open it in your browser

## Routes and Navigation

- **/** - Home page with app introduction
- **/login** - Login page with magic link authentication
- **/signup** - Sign up page for new users
- **/dashboard** - Main dashboard showing tasks from friends (protected route)
- **/friends** - Manage your friend connections (protected route)
- **/assign** - Assign tasks to friends (protected route)
- **/leaderboard** - View rankings of you and your friends (protected route) 