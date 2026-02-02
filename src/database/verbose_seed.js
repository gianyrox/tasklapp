/**
 * Verbose Seed Data Generator with Debug Output
 * 
 * This script generates SQL with additional debug statements and error handling
 * to diagnose issues with inserting data into Supabase.
 */

const fs = require('fs');
const path = require('path');

// Original random seed generator code
const CONFIG = {
  numberOfUsers: 3,          // Reduced for debugging
  friendshipDensity: 0.8,    // Higher for testing connections
  tasksPerUser: 2,           // Reduced for debugging
  completedTaskPercentage: 0.5,
  inProgressPercentage: 0.3,
  overduePercentage: 0.0,    // Removed overdue for simplicity
  maxEstimatedMinutes: 60,   // Shorter times
  attachmentProbability: 0.2,
  daysInPast: 30,
  daysInFuture: 15
};

// Sample data arrays (abbreviated versions)
const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
const taskTitles = ['Help me move', 'Review document', 'Fix my laptop'];
const taskDescriptions = ['Could use your help with this.', 'This is important to me.'];
const feedback = ['Great job!', 'Perfect, thank you!', 'Excellent work!'];

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomArrayElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startDaysAgo, endDaysAhead) {
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);
  
  const end = new Date();
  end.setDate(end.getDate() + endDaysAhead);
  
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function randomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

// SQL generation with debug steps
let sql = `-- Verbose Debug Seed Script
-- Generated on ${new Date().toISOString()}
-- This script includes additional debug output and error handling

-- Enable debug output
\\set VERBOSITY verbose

-- Begin transaction to allow rollback if needed
BEGIN;

-- Check if the UUID extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE NOTICE 'uuid-ossp extension is not enabled. Enabling it now...';
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ELSE
    RAISE NOTICE 'uuid-ossp extension is already enabled.';
  END IF;
END $$;

-- Verify tables exist and have the expected structure
DO $$
DECLARE
  missing_tables TEXT := '';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    missing_tables := missing_tables || 'users, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friendships') THEN
    missing_tables := missing_tables || 'friendships, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    missing_tables := missing_tables || 'tasks, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_attachments') THEN
    missing_tables := missing_tables || 'task_attachments, ';
  END IF;
  
  IF missing_tables <> '' THEN
    missing_tables := TRIM(TRAILING ', ' FROM missing_tables);
    RAISE WARNING 'Missing tables: %', missing_tables;
    RAISE WARNING 'Please run the schema.sql script first to create all required tables.';
  ELSE
    RAISE NOTICE 'All required tables exist.';
  END IF;
END $$;

-- Temporarily disable RLS for debugging
DO $$
BEGIN
  RAISE NOTICE 'Temporarily disabling Row Level Security for debugging...';
  
  -- Store original RLS state to restore later
  CREATE TEMP TABLE IF NOT EXISTS rls_state (
    table_name TEXT,
    is_enabled BOOLEAN
  );
  
  INSERT INTO rls_state
  SELECT
    tablename,
    rls_enabled
  FROM
    pg_tables
  WHERE
    schemaname = 'public'
    AND tablename IN ('users', 'friendships', 'tasks', 'task_attachments');
  
  -- Disable RLS
  ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS friendships DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS task_attachments DISABLE ROW LEVEL SECURITY;
END $$;

DO $$
DECLARE
`;

// Generate user variables
for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  sql += `  user${i}_id UUID;\n`;
}

// Generate task variables
const totalTasks = CONFIG.numberOfUsers * CONFIG.tasksPerUser;
for (let i = 1; i <= totalTasks; i++) {
  sql += `  task${i}_id UUID;\n`;
}

sql += `  error_message TEXT;\n`;
sql += `  v_count INTEGER;\n`;
sql += `BEGIN\n`;
sql += `  RAISE NOTICE 'Starting seed data generation with debug output...';\n`;
sql += `  RAISE NOTICE 'Generating % users and approximately % tasks...', ${CONFIG.numberOfUsers}, ${totalTasks};\n`;

// Generate users with error handling
const users = [];
for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  const firstName = randomArrayElement(firstNames);
  const lastName = randomArrayElement(lastNames);
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@example.com`;
  const avatarGender = randomBoolean() ? 'men' : 'women';
  const avatarId = randomInt(1, 99);
  const createdAt = randomDate(CONFIG.daysInPast, 0);
  
  users.push({ id: i, name, email, avatarGender, avatarId, createdAt });
  
  sql += `
  -- Insert user ${i}: ${name}
  BEGIN
    RAISE NOTICE 'Inserting user ${i}: ${name} with email ${email}...';
    
    INSERT INTO users (id, name, email, avatar_url, created_at)
    VALUES 
      (uuid_generate_v4(), '${name}', '${email}', 'https://randomuser.me/api/portraits/${avatarGender}/${avatarId}.jpg', '${formatDate(createdAt)}')
    RETURNING id INTO user${i}_id;
    
    IF user${i}_id IS NULL THEN
      RAISE WARNING 'Failed to get ID for inserted user ${i}';
    ELSE
      RAISE NOTICE 'Successfully inserted user ${i} with ID: %', user${i}_id;
    END IF;
    
    -- Verify the user was inserted
    SELECT COUNT(*) INTO v_count FROM users WHERE email = '${email}';
    IF v_count = 0 THEN
      RAISE WARNING 'User ${i} does not appear in the users table after insert';
    ELSE
      RAISE NOTICE 'Verified user ${i} exists in database';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'Error inserting user ${i}: %', error_message;
  END;
  `;
}

// Generate friendships with error handling
sql += `\n  -- Create friendships between users\n`;
sql += `  RAISE NOTICE 'Creating friendships between users...';\n`;

for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  for (let j = i + 1; j <= CONFIG.numberOfUsers; j++) {
    if (randomBoolean(CONFIG.friendshipDensity)) {
      const status = randomBoolean(0.9) ? 'ACCEPTED' : 'PENDING'; // More accepted friendships for testing
      const createdAt = randomDate(CONFIG.daysInPast / 2, 0);
      const updatedAt = new Date(createdAt);
      if (status === 'ACCEPTED') {
        updatedAt.setDate(updatedAt.getDate() + randomInt(1, 3));
      }
      
      sql += `
  BEGIN
    RAISE NOTICE 'Creating friendship between user${i} and user${j} with status ${status}...';
    
    INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
    VALUES (user${i}_id, user${j}_id, '${status}', '${formatDate(createdAt)}', '${formatDate(updatedAt)}');
    
    -- Verify the friendship was inserted
    SELECT COUNT(*) INTO v_count FROM friendships 
    WHERE (user_id = user${i}_id AND friend_id = user${j}_id)
       OR (user_id = user${j}_id AND friend_id = user${i}_id);
       
    IF v_count = 0 THEN
      RAISE WARNING 'Friendship between user${i} and user${j} does not appear after insert';
    ELSE
      RAISE NOTICE 'Verified friendship exists between user${i} and user${j}';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'Error creating friendship between user${i} and user${j}: %', error_message;
  END;
  `;
    }
  }
}

// Generate tasks with error handling
sql += `\n  -- Create tasks\n`;
sql += `  RAISE NOTICE 'Creating tasks...';\n`;

let taskCounter = 1;
for (let i = 1; i <= CONFIG.numberOfUsers && taskCounter <= totalTasks; i++) {
  const numTasksToCreate = Math.min(
    CONFIG.tasksPerUser,
    totalTasks - taskCounter + 1
  );
  
  for (let t = 0; t < numTasksToCreate; t++) {
    // Select a random recipient for this task (not the same user)
    let recipient;
    do {
      recipient = randomInt(1, CONFIG.numberOfUsers);
    } while (recipient === i);
    
    const title = randomArrayElement(taskTitles);
    const description = randomArrayElement(taskDescriptions);
    const createdAt = randomDate(CONFIG.daysInPast, 0);
    const dueDate = randomDate(0, CONFIG.daysInFuture);
    const estimatedTimeMinutes = randomInt(10, CONFIG.maxEstimatedMinutes);
    
    // Determine task status
    let status, completedAt, submissionDate, actualTimeMinutes, qualityRating, feedbackText;
    const statusRandom = Math.random();
    
    if (statusRandom < CONFIG.completedTaskPercentage) {
      status = 'COMPLETED';
      completedAt = new Date(dueDate);
      completedAt.setDate(completedAt.getDate() - randomInt(1, 5));
      if (completedAt < createdAt) {
        completedAt = new Date(createdAt);
        completedAt.setDate(completedAt.getDate() + randomInt(1, 3));
      }
      submissionDate = completedAt;
      actualTimeMinutes = randomInt(
        Math.max(5, Math.floor(estimatedTimeMinutes * 0.8)),
        Math.ceil(estimatedTimeMinutes * 1.2)
      );
      qualityRating = randomInt(3, 5); // Higher ratings for simplicity
      feedbackText = randomArrayElement(feedback);
    } else if (statusRandom < (CONFIG.completedTaskPercentage + CONFIG.inProgressPercentage)) {
      status = 'IN_PROGRESS';
    } else {
      status = 'PENDING';
    }
    
    const priority = ['MEDIUM', 'HIGH'][randomInt(0, 1)]; // Just medium and high for simplicity
    
    // Build the SQL for this task with error handling
    sql += `
  -- Task ${taskCounter}: ${title} (${status})
  BEGIN
    RAISE NOTICE 'Creating task ${taskCounter}: ${title} with status ${status}...';
    
    INSERT INTO tasks (
      title, description, created_at, due_date, 
      assigner_id, assignee_id, status, priority, 
      estimated_time_minutes`;
    
    if (status === 'COMPLETED') {
      sql += `, 
      actual_time_minutes, completed_at, submission_date, 
      quality_rating, feedback`;
    }
    
    sql += `
    )
    VALUES (
      '${title}', 
      '${description}',
      '${formatDate(createdAt)}',
      '${formatDate(dueDate)}',
      user${i}_id, user${recipient}_id, '${status}', '${priority}', 
      ${estimatedTimeMinutes}`;
    
    if (status === 'COMPLETED') {
      sql += `, 
      ${actualTimeMinutes}, '${formatDate(completedAt)}', '${formatDate(submissionDate)}',
      ${qualityRating}, '${feedbackText}'`;
    }
    
    sql += `
    )
    RETURNING id INTO task${taskCounter}_id;
    
    IF task${taskCounter}_id IS NULL THEN
      RAISE WARNING 'Failed to get ID for inserted task ${taskCounter}';
    ELSE
      RAISE NOTICE 'Successfully inserted task ${taskCounter} with ID: %', task${taskCounter}_id;
    END IF;
    
    -- Verify the task was inserted
    SELECT COUNT(*) INTO v_count FROM tasks WHERE id = task${taskCounter}_id;
    IF v_count = 0 THEN
      RAISE WARNING 'Task ${taskCounter} does not appear in the tasks table after insert';
    ELSE
      RAISE NOTICE 'Verified task ${taskCounter} exists in database';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'Error inserting task ${taskCounter}: %', error_message;
  END;
  `;
    
    taskCounter++;
  }
}

// Restore RLS settings
sql += `
  -- Restore original RLS settings
  RAISE NOTICE 'Restoring original Row Level Security settings...';
  
  -- Show final counts
  SELECT COUNT(*) INTO v_count FROM users;
  RAISE NOTICE 'Total users in database: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM friendships;
  RAISE NOTICE 'Total friendships in database: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM tasks;
  RAISE NOTICE 'Total tasks in database: %', v_count;
  
  -- Output success message
  RAISE NOTICE 'Seed data generation completed successfully!';
END $$;

-- Restore RLS settings
DO $$
BEGIN
  RAISE NOTICE 'Restoring original Row Level Security settings...';
  
  -- Restore RLS for each table based on saved state
  FOR r IN SELECT * FROM rls_state LOOP
    IF r.is_enabled THEN
      EXECUTE 'ALTER TABLE ' || r.table_name || ' ENABLE ROW LEVEL SECURITY;';
      RAISE NOTICE 'Re-enabled RLS for table: %', r.table_name;
    END IF;
  END LOOP;
  
  -- Clean up temp table
  DROP TABLE IF EXISTS rls_state;
END $$;

-- Show final table counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'friendships' as table_name, COUNT(*) as row_count FROM friendships
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as row_count FROM tasks
UNION ALL
SELECT 'task_attachments' as table_name, COUNT(*) as row_count FROM task_attachments;

-- Commit the transaction if all went well
COMMIT;
`;

// Output the SQL to console
console.log(sql);

// Write to file
try {
  fs.writeFileSync(path.join(__dirname, 'verbose_seed.sql'), sql);
  console.log('Verbose seed SQL written to verbose_seed.sql');
} catch (error) {
  console.error('Error writing SQL to file:', error);
} 