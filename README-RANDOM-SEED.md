# Random Seed Data Generator

This utility generates random test data for the Task App database, creating users, friendships, and tasks with realistic relationships and properties.

## Features

- Creates a configurable number of random users
- Establishes friendships between users with a controllable density
- Generates tasks assigned between friends with various statuses
- Creates realistic task metadata like completion time, quality ratings, and feedback
- Adds file attachments to some tasks
- Outputs a ready-to-use SQL script for Supabase

## How to Use

1. Make sure you have Node.js installed on your system
2. Navigate to the project directory
3. Run the generator:

```bash
node src/database/generate_random_seed.js > random_seed.sql
```

4. The script will output SQL to the console and save it to `random_seed.sql` if using the redirect
5. Run the generated SQL in your Supabase SQL Editor

## Configuration

You can modify the configuration variables at the top of the script to control the amount and characteristics of the generated data:

```javascript
const CONFIG = {
  numberOfUsers: 10,            // How many users to create
  friendshipDensity: 0.4,       // Percentage of possible connections (0-1)
  tasksPerUser: 5,              // Average number of tasks per user
  completedTaskPercentage: 0.4, // Percentage of tasks that are completed
  inProgressPercentage: 0.3,    // Percentage of tasks that are in progress
  overduePercentage: 0.15,      // Percentage of tasks that are overdue
  maxEstimatedMinutes: 240,     // Maximum estimated minutes for a task
  attachmentProbability: 0.2,   // Probability a task has attachments
  daysInPast: 60,               // Max days in the past for creation dates
  daysInFuture: 30              // Max days in the future for due dates
};
```

## Testing Scenarios

The random data generator is perfect for testing:

### Large Dataset Performance

```javascript
// Update these values in the script
const CONFIG = {
  numberOfUsers: 50,
  tasksPerUser: 20,
  ...
};
```

### Various Friendship Network Densities

```javascript
// Sparse network
const CONFIG = {
  friendshipDensity: 0.2,
  ...
};

// Dense network
const CONFIG = {
  friendshipDensity: 0.8,
  ...
};
```

### Task Status Distribution

```javascript
// Mostly completed tasks
const CONFIG = {
  completedTaskPercentage: 0.7,
  inProgressPercentage: 0.2,
  overduePercentage: 0.05,
  ...
};

// Mostly pending tasks
const CONFIG = {
  completedTaskPercentage: 0.2,
  inProgressPercentage: 0.2,
  overduePercentage: 0.1,
  ...
};
```

## Using with Test Accounts

After generating the random data, you can:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Find a user you'd like to test with
4. Copy their UUID
5. Update your local `.env.local` file:

```
NEXT_PUBLIC_TEST_USER_ID=paste-the-copied-uuid-here
```

This will let you log in as that user in your development environment.

## Warning

**The generated SQL includes commented-out DELETE statements that would clear your existing data.** Only uncomment these if you want to start with a completely fresh database.

```sql
-- Uncomment these lines if you want to start fresh
-- DELETE FROM task_attachments;
-- DELETE FROM tasks;
-- DELETE FROM friendships;
-- DELETE FROM users;
``` 