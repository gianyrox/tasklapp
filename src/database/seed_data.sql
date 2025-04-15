-- Supabase Seed Data for Task App with Friend-based System
-- This script creates test users, friendships, and tasks to help test the application

-- Clear existing data (use with caution in production)
-- Uncomment these lines if you want to start fresh
-- DELETE FROM task_attachments;
-- DELETE FROM tasks;
-- DELETE FROM friendships;
-- DELETE FROM users;

-- Insert test users - storing UUIDs in variables for later use
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  user4_id UUID;
  task1_id UUID;
  task2_id UUID;
  task3_id UUID;
  task4_id UUID;
  task5_id UUID;
  task6_id UUID;
  task7_id UUID;
  task8_id UUID;
  task9_id UUID;
  task10_id UUID;
  task11_id UUID;
  task12_id UUID;
BEGIN
  -- Insert users and store their IDs
  INSERT INTO users (id, name, email, avatar_url, created_at)
  VALUES 
    (uuid_generate_v4(), 'Alice Johnson', 'alice@example.com', 'https://randomuser.me/api/portraits/women/1.jpg', NOW() - INTERVAL '30 days')
  RETURNING id INTO user1_id;
  
  INSERT INTO users (id, name, email, avatar_url, created_at)
  VALUES 
    (uuid_generate_v4(), 'Bob Smith', 'bob@example.com', 'https://randomuser.me/api/portraits/men/1.jpg', NOW() - INTERVAL '25 days')
  RETURNING id INTO user2_id;
  
  INSERT INTO users (id, name, email, avatar_url, created_at)
  VALUES 
    (uuid_generate_v4(), 'Carol Davis', 'carol@example.com', 'https://randomuser.me/api/portraits/women/2.jpg', NOW() - INTERVAL '20 days')
  RETURNING id INTO user3_id;
  
  INSERT INTO users (id, name, email, avatar_url, created_at)
  VALUES 
    (uuid_generate_v4(), 'David Wilson', 'david@example.com', 'https://randomuser.me/api/portraits/men/2.jpg', NOW() - INTERVAL '15 days')
  RETURNING id INTO user4_id;

  -- Create friendships between users
  -- Alice and Bob are friends
  INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
  VALUES (user1_id, user2_id, 'ACCEPTED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days');
  
  -- Alice and Carol are friends
  INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
  VALUES (user1_id, user3_id, 'ACCEPTED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days');
  
  -- Bob and David are friends
  INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
  VALUES (user2_id, user4_id, 'ACCEPTED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days');
  
  -- Carol has sent a friend request to David (pending)
  INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
  VALUES (user3_id, user4_id, 'PENDING', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

  -- Insert tasks from Bob to Alice
  -- Task 1: Pending task
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Review presentation slides', 
    'Please review my presentation slides for the client meeting and provide feedback',
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '2 days',
    user2_id, user1_id, 'PENDING', 'MEDIUM', 45
  )
  RETURNING id INTO task1_id;
  
  -- Task 2: In progress task
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Help debug login issue', 
    'I cannot figure out why the login page is crashing. Can you take a look?',
    NOW() - INTERVAL '8 days',
    NOW() + INTERVAL '1 day',
    user2_id, user1_id, 'IN_PROGRESS', 'HIGH', 90
  )
  RETURNING id INTO task2_id;
  
  -- Task 3: Completed task with ratings
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes, actual_time_minutes,
    completed_at, submission_date, quality_rating, feedback
  )
  VALUES (
    'Proofread my essay', 
    'Could you proofread my 5-page essay on climate change?',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '10 days',
    user2_id, user1_id, 'COMPLETED', 'MEDIUM', 
    60, 45, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days',
    5, 'Great job! Found all my typos and suggested better phrasing in several places.'
  )
  RETURNING id INTO task3_id;
  
  -- Insert tasks from Carol to Alice
  -- Task 4: Overdue task
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Help me move apartments', 
    'Need help moving some boxes to my new place. Lunch is on me!',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 days',
    user3_id, user1_id, 'OVERDUE', 'LOW', 120
  )
  RETURNING id INTO task4_id;
  
  -- Task 5: Pending task with high priority
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Pick up birthday gift', 
    'Can you pick up the gift I ordered for my mom? It''s at the store on Main St.',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '3 days',
    user3_id, user1_id, 'PENDING', 'HIGH', 30
  )
  RETURNING id INTO task5_id;
  
  -- Insert tasks from Alice to Bob and Carol
  -- Task 6: Alice -> Bob (Pending)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Lend me your camera', 
    'Can I borrow your DSLR camera for the weekend trip?',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '1 day',
    user1_id, user2_id, 'PENDING', 'MEDIUM', 15
  )
  RETURNING id INTO task6_id;
  
  -- Task 7: Alice -> Bob (Completed with lower rating)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes, actual_time_minutes,
    completed_at, submission_date, quality_rating, feedback
  )
  VALUES (
    'Fix my laptop', 
    'My laptop is running slow. Can you take a look and try to speed it up?',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '15 days',
    user1_id, user2_id, 'COMPLETED', 'HIGH', 
    60, 90, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days',
    3, 'It''s a bit faster but still has some issues. Thanks for trying though!'
  )
  RETURNING id INTO task7_id;
  
  -- Task 8: Alice -> Carol (In Progress)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Design logo for project', 
    'I need a simple logo for my new side project. Something minimal but modern.',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '5 days',
    user1_id, user3_id, 'IN_PROGRESS', 'HIGH', 120
  )
  RETURNING id INTO task8_id;
  
  -- Task 9: Alice -> Carol (Completed with high rating)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes, actual_time_minutes,
    completed_at, submission_date, quality_rating, feedback
  )
  VALUES (
    'Recommend a good book', 
    'I''m looking for a new sci-fi book to read. Something like Project Hail Mary.',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days',
    user1_id, user3_id, 'COMPLETED', 'LOW', 
    20, 15, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days',
    5, 'Perfect recommendation! I loved the book.'
  )
  RETURNING id INTO task9_id;
  
  -- Some tasks between Bob and David
  -- Task 10: Bob -> David (Completed)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes, actual_time_minutes,
    completed_at, submission_date, quality_rating, feedback
  )
  VALUES (
    'Car maintenance help', 
    'Need help changing oil in my car this weekend',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '10 days',
    user2_id, user4_id, 'COMPLETED', 'MEDIUM', 
    60, 45, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days',
    4, 'Thanks for the help and for showing me how to do it myself next time!'
  )
  RETURNING id INTO task10_id;
  
  -- Task 11: David -> Bob (Pending)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Help setup home network', 
    'Moving to a new place and need help setting up my wifi and smart home devices',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '4 days',
    user4_id, user2_id, 'PENDING', 'HIGH', 120
  )
  RETURNING id INTO task11_id;
  
  -- Add a task with attachments
  -- Task 12: Carol -> Alice (In Progress with attachments)
  INSERT INTO tasks (
    title, description, created_at, due_date, 
    assigner_id, assignee_id, status, priority, 
    estimated_time_minutes
  )
  VALUES (
    'Review my website design', 
    'I''ve created a new portfolio website. Can you review the design and give feedback?',
    NOW() - INTERVAL '4 days',
    NOW() + INTERVAL '3 days',
    user3_id, user1_id, 'IN_PROGRESS', 'MEDIUM', 45
  )
  RETURNING id INTO task12_id;
  
  -- Add attachments to task 12
  INSERT INTO task_attachments (task_id, file_url, file_type, file_name, created_at)
  VALUES 
    (task12_id, 'https://example.com/files/homepage.png', 'image/png', 'homepage.png', NOW() - INTERVAL '4 days'),
    (task12_id, 'https://example.com/files/about.png', 'image/png', 'about.png', NOW() - INTERVAL '4 days');
  
  -- Output the generated IDs to console for reference
  RAISE NOTICE 'Generated Users: Alice(%), Bob(%), Carol(%), David(%)', user1_id, user2_id, user3_id, user4_id;

END $$; 