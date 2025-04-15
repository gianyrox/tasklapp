/**
 * Random Seed Data Generator for Task App
 * 
 * This script generates random users, friendships, and tasks for testing purposes.
 * It outputs SQL that can be run in the Supabase SQL Editor.
 * 
 * Usage:
 * - Run with Node.js: node generate_random_seed.js > random_seed.sql
 * - Customize parameters below to control the amount of data generated
 */

// Configuration - adjust these values to generate different amounts of data
const CONFIG = {
  numberOfUsers: 10,         // How many users to create
  friendshipDensity: 0.4,    // Percentage of possible connections to create (0-1)
  tasksPerUser: 5,           // Average number of tasks assigned by each user
  completedTaskPercentage: 0.4, // Percentage of tasks that are completed
  inProgressPercentage: 0.3, // Percentage of tasks that are in progress
  overduePercentage: 0.15,   // Percentage of tasks that are overdue
  maxEstimatedMinutes: 240,  // Maximum estimated minutes for a task
  attachmentProbability: 0.2, // Probability a task has attachments
  daysInPast: 60,            // How many days in the past users/tasks can be created
  daysInFuture: 30           // How many days in the future tasks can be due
};

// Arrays for generating random data
const firstNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 
  'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
  'Thomas', 'Karen', 'Charles', 'Nancy', 'Christopher', 'Lisa', 'Daniel', 'Margaret',
  'Matthew', 'Betty', 'Anthony', 'Sandra', 'Mark', 'Ashley', 'Donald', 'Kimberly',
  'Steven', 'Emily', 'Paul', 'Donna', 'Andrew', 'Michelle', 'Joshua', 'Carol'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Adams'
];

const taskTitles = [
  'Help me move apartments', 'Proofread my essay', 'Fix my laptop', 'Pick up groceries',
  'Drive me to the airport', 'Water my plants while I\'m away', 'Review my presentation slides',
  'Help debug code issue', 'Give feedback on my portfolio', 'Teach me how to cook pasta',
  'Lend me your camera', 'Design a logo for my project', 'Edit my vacation photos', 
  'Help setup home network', 'Recommend a good book', 'Fix flat tire on my bike',
  'Record a voiceover for my video', 'Translate document to Spanish', 'Help plan surprise party',
  'Review my resume', 'Help with math homework', 'Create a playlist for my party',
  'Borrow your camping gear', 'Drive me to doctor appointment', 'Teach me to play guitar',
  'Give feedback on my writing', 'Trim my dog\'s fur', 'Help assemble furniture',
  'Show me how to use Photoshop', 'Review my business plan', 'Pick up my mail while I\'m gone'
];

const taskDescriptions = [
  'I could really use your help with this. Let me know when you\'re available!',
  'This is important to me and I would really appreciate your assistance.',
  'I know you\'re good at this and could use your expertise.',
  'Sorry for the short notice, but could you help me out?',
  'I promise it won\'t take long and I\'ll return the favor someday!',
  'I\'ve been struggling with this and could use your perspective.',
  'You mentioned you\'d help with this before - is the offer still good?',
  'This shouldn\'t take more than an hour or two of your time.',
  'I\'ve heard you\'re great at this and would value your input.',
  'Been putting this off for too long, could use your motivation to get it done.',
  'Would really appreciate your help when you have some free time.',
  'I\'ll provide everything you need, just need your skills for this one task.',
  'Let me know if you need more details to help with this.'
];

const feedback = [
  'Great job! Exactly what I needed.',
  'Thanks for the help, this was perfect!',
  'You really went above and beyond, I appreciate it!',
  'Good work, though it took a bit longer than expected.',
  'Solid effort, thanks for your time.',
  'Thanks, this helps a lot with my project.',
  'Excellent work as always, you\'re the best!',
  'The quality was outstanding, thank you so much!',
  'Thanks for the quick turnaround on this.',
  'Not exactly what I had in mind, but still helpful.',
  'You really saved me with this, thank you!',
  'This exceeded my expectations, amazing work!',
  'Thanks for the effort, it\'s mostly what I needed.',
  'I appreciate your help with this task.',
  'Fantastic job, couldn\'t have done it without you!'
];

const fileTypes = [
  { type: 'image/jpeg', ext: 'jpg' },
  { type: 'image/png', ext: 'png' },
  { type: 'application/pdf', ext: 'pdf' },
  { type: 'application/msword', ext: 'doc' },
  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
  { type: 'text/plain', ext: 'txt' },
  { type: 'application/zip', ext: 'zip' }
];

const fileNames = [
  'document', 'presentation', 'report', 'screenshot', 'image', 'proposal', 
  'draft', 'final_version', 'notes', 'summary', 'design', 'mockup', 'sketch',
  'blueprint', 'guidelines', 'instructions', 'reference', 'sample', 'example',
  'attachment', 'data', 'spreadsheet', 'chart', 'graph', 'diagram', 'photo'
];

// Utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
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

// SQL generation
let sql = `-- Auto-generated random seed data
-- Generated on ${new Date().toISOString()}

-- Clear existing data (use with caution in production)
-- Uncomment these lines if you want to start fresh
-- DELETE FROM task_attachments;
-- DELETE FROM tasks;
-- DELETE FROM friendships;
-- DELETE FROM users;

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

sql += `BEGIN\n`;

// Generate users
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
  INSERT INTO users (id, name, email, avatar_url, created_at)
  VALUES 
    (uuid_generate_v4(), '${name}', '${email}', 'https://randomuser.me/api/portraits/${avatarGender}/${avatarId}.jpg', '${formatDate(createdAt)}')
  RETURNING id INTO user${i}_id;\n`;
}

// Generate friendships
sql += `\n  -- Create friendships between users\n`;
for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  for (let j = i + 1; j <= CONFIG.numberOfUsers; j++) {
    if (randomBoolean(CONFIG.friendshipDensity)) {
      const status = randomBoolean(0.8) ? 'ACCEPTED' : 'PENDING';
      const createdAt = randomDate(CONFIG.daysInPast / 2, 0);
      const updatedAt = new Date(createdAt);
      if (status === 'ACCEPTED') {
        updatedAt.setDate(updatedAt.getDate() + randomInt(1, 5));
      }
      
      sql += `  INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
  VALUES (user${i}_id, user${j}_id, '${status}', '${formatDate(createdAt)}', '${formatDate(updatedAt)}');\n`;
    }
  }
}

// Generate tasks
sql += `\n  -- Create tasks\n`;
let taskCounter = 1;
for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  const numTasksToCreate = randomInt(
    Math.max(1, CONFIG.tasksPerUser - 2),
    CONFIG.tasksPerUser + 2
  );
  
  for (let t = 0; t < numTasksToCreate && taskCounter <= totalTasks; t++) {
    // Select a random recipient for this task (not the same user)
    let recipient;
    do {
      recipient = randomInt(1, CONFIG.numberOfUsers);
    } while (recipient === i);
    
    const title = randomArrayElement(taskTitles);
    const description = randomArrayElement(taskDescriptions);
    const createdAt = randomDate(CONFIG.daysInPast, 0);
    const dueDate = randomDate(-CONFIG.daysInPast / 3, CONFIG.daysInFuture);
    const estimatedTimeMinutes = randomInt(10, CONFIG.maxEstimatedMinutes);
    
    // Determine task status
    let status, completedAt, submissionDate, actualTimeMinutes, qualityRating, feedbackText;
    const statusRandom = Math.random();
    
    if (dueDate < new Date() && statusRandom < CONFIG.overduePercentage) {
      status = 'OVERDUE';
    } else if (statusRandom < CONFIG.completedTaskPercentage) {
      status = 'COMPLETED';
      completedAt = new Date(dueDate);
      completedAt.setDate(completedAt.getDate() - randomInt(1, 10));
      if (completedAt < createdAt) {
        completedAt = new Date(createdAt);
        completedAt.setDate(completedAt.getDate() + randomInt(1, 5));
      }
      submissionDate = completedAt;
      actualTimeMinutes = randomInt(
        Math.max(5, Math.floor(estimatedTimeMinutes * 0.5)),
        Math.ceil(estimatedTimeMinutes * 1.5)
      );
      qualityRating = randomInt(1, 5);
      feedbackText = randomArrayElement(feedback);
    } else if (statusRandom < (CONFIG.completedTaskPercentage + CONFIG.inProgressPercentage)) {
      status = 'IN_PROGRESS';
    } else {
      status = 'PENDING';
    }
    
    const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][randomInt(0, 3)];
    
    // Build the SQL for this task
    sql += `  -- Task ${taskCounter}: ${title} (${status})
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
  RETURNING id INTO task${taskCounter}_id;\n`;
    
    // Add attachments with some probability
    if (randomBoolean(CONFIG.attachmentProbability)) {
      const numAttachments = randomInt(1, 3);
      sql += `\n  -- Attachments for task ${taskCounter}\n`;
      
      for (let a = 0; a < numAttachments; a++) {
        const fileType = randomArrayElement(fileTypes);
        const fileName = `${randomArrayElement(fileNames)}_${randomInt(1, 100)}.${fileType.ext}`;
        const attachmentDate = new Date(createdAt);
        attachmentDate.setDate(attachmentDate.getDate() + randomInt(0, 3));
        
        sql += `  INSERT INTO task_attachments (task_id, file_url, file_type, file_name, created_at)
  VALUES (task${taskCounter}_id, 'https://example.com/files/${fileName}', '${fileType.type}', '${fileName}', '${formatDate(attachmentDate)}');\n`;
      }
    }
    
    sql += `\n`;
    taskCounter++;
  }
}

// Output user IDs for reference
sql += `  -- Output the generated user IDs for reference
  RAISE NOTICE 'Generated Users:`;
for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  sql += ` User${i}(%),`;
}
sql = sql.slice(0, -1); // Remove trailing comma
sql += `', `;
for (let i = 1; i <= CONFIG.numberOfUsers; i++) {
  sql += `user${i}_id`;
  if (i < CONFIG.numberOfUsers) sql += ', ';
}
sql += `;\n`;

// Close the DO block
sql += `END $$;`;

// Output the generated SQL
console.log(sql); 