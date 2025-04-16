-- Seed file for test tasks
\i src/database/seeds/tasks_function.sql

-- Add a variety of tasks with different statuses, priorities, and between different users

-- PENDING tasks
SELECT add_test_task(
  'user1@example.com', 'user2@example.com',
  'Design new logo for the app',
  'We need a fresh logo that better represents our brand values. Please include 3 variations.',
  'PENDING', 'HIGH', 10, 120
);

SELECT add_test_task(
  'user3@example.com', 'user1@example.com',
  'Review API documentation',
  'Please review the REST API docs for completeness and technical accuracy.',
  'PENDING', 'MEDIUM', 5, 90
);

SELECT add_test_task(
  'user2@example.com', 'user5@example.com',
  'Research competitors pricing models',
  'Create a spreadsheet comparing our pricing to top 5 competitors in the market.',
  'PENDING', 'LOW', 14, 180
);

-- IN_PROGRESS tasks
SELECT add_test_task(
  'user4@example.com', 'user3@example.com',
  'Implement user authentication',
  'Add OAuth with Google and Microsoft support for the login process.',
  'IN_PROGRESS', 'HIGH', 3, 240
);

SELECT add_test_task(
  'user5@example.com', 'user4@example.com',
  'Fix navigation responsiveness',
  'The navigation menu breaks on mobile. Please fix for all screen sizes.',
  'IN_PROGRESS', 'MEDIUM', 2, 60
);

SELECT add_test_task(
  'user6@example.com', 'user7@example.com',
  'Write content for about page',
  'Create compelling content for the About Us section with team bios.',
  'IN_PROGRESS', 'MEDIUM', 8, 90
);

-- COMPLETED tasks with ratings and feedback
SELECT add_test_task(
  'user8@example.com', 'user9@example.com',
  'Set up analytics tracking',
  'Implement Google Analytics and create a basic dashboard for the team.',
  'COMPLETED', 'HIGH', -3, 120, 110, 5,
  'Excellent work! The dashboard is very intuitive and exactly what we needed.'
);

SELECT add_test_task(
  'user10@example.com', 'user11@example.com',
  'Design email newsletter template',
  'Create a responsive email template that matches our brand guidelines.',
  'COMPLETED', 'MEDIUM', -5, 90, 105, 4,
  'Good work, but needed some revisions to match our exact color scheme.'
);

SELECT add_test_task(
  'user12@example.com', 'user13@example.com',
  'Create social media graphics',
  'Design a set of templates we can use across our social media channels.',
  'COMPLETED', 'LOW', -10, 150, 135, 5,
  'Perfect! These templates are great and very versatile.'
);

-- OVERDUE tasks
SELECT add_test_task(
  'user14@example.com', 'user15@example.com',
  'Prepare quarterly report',
  'Compile data and prepare the Q2 performance report for stakeholders.',
  'OVERDUE', 'HIGH', -2, 240
);

SELECT add_test_task(
  'user1@example.com', 'user3@example.com',
  'Update privacy policy',
  'Review and update our privacy policy to comply with latest regulations.',
  'OVERDUE', 'URGENT', -5, 180
);

-- More COMPLETED tasks with different ratings
SELECT add_test_task(
  'user5@example.com', 'user2@example.com',
  'Fix login bug on Safari',
  'The login form does not submit properly on Safari browsers.',
  'COMPLETED', 'HIGH', -7, 60, 45, 5,
  'Fixed quickly and efficiently!'
);

SELECT add_test_task(
  'user7@example.com', 'user4@example.com',
  'Optimize database queries',
  'Review and optimize the slow-performing database queries.',
  'COMPLETED', 'MEDIUM', -12, 180, 200, 3,
  'Queries are faster but there is still room for improvement.'
);

SELECT add_test_task(
  'user9@example.com', 'user6@example.com',
  'Create user onboarding flow',
  'Design and implement a better onboarding experience for new users.',
  'COMPLETED', 'HIGH', -15, 240, 260, 4,
  'Great improvement to the user experience!'
);

-- Additional PENDING tasks
SELECT add_test_task(
  'user11@example.com', 'user8@example.com',
  'Implement dark mode',
  'Add a dark mode theme option with proper color scheme.',
  'PENDING', 'MEDIUM', 20, 120
);

SELECT add_test_task(
  'user13@example.com', 'user10@example.com',
  'Setup continuous integration',
  'Configure GitHub Actions for automated testing and deployment.',
  'PENDING', 'HIGH', 7, 180
);

-- Additional IN_PROGRESS tasks
SELECT add_test_task(
  'user15@example.com', 'user12@example.com',
  'Migrate to new API version',
  'Update all endpoints to use v2 of the API with new authentication.',
  'IN_PROGRESS', 'URGENT', 4, 300
);

SELECT add_test_task(
  'user2@example.com', 'user14@example.com',
  'Create sales presentations',
  'Design slide deck templates for the sales team to use with clients.',
  'IN_PROGRESS', 'MEDIUM', 6, 150
);

-- Additional tasks with varied priority levels
SELECT add_test_task(
  'user4@example.com', 'user1@example.com',
  'Conduct user research',
  'Interview 10 users about their experience with the latest features.',
  'PENDING', 'URGENT', 3, 240
);

SELECT add_test_task(
  'user6@example.com', 'user3@example.com',
  'Update dependencies',
  'Audit and update all project dependencies to latest versions.',
  'PENDING', 'LOW', 30, 120
);

-- Instructions for using this script:
-- 1. Connect to your Supabase PostgreSQL database with admin privileges
-- 2. Make sure all users are created first by running user seed files
-- 3. Run this script to create task assignments between test users 