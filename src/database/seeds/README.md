# Supabase Test User Seed Files

This directory contains SQL scripts for creating test users in the Supabase Auth system and the application's users table.

## File Structure

- `function.sql` - Contains the function definition for adding test users
- `user1.sql` to `user15.sql` - Individual files for adding each test user
- `all_users.sql` - A file that includes all individual user files to add all users at once

## Using the Seed Files

### Prerequisites

- Access to your Supabase PostgreSQL database with admin privileges
- psql client installed or Supabase SQL Editor access

### Adding All Test Users

To add all test users at once:

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f src/database/seeds/all_users.sql
```

Or in the Supabase SQL Editor, run:

```sql
\i src/database/seeds/all_users.sql
```

### Adding Individual Users

To add just one specific user:

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f src/database/seeds/user1.sql
```

Or in the Supabase SQL Editor, run:

```sql
\i src/database/seeds/user1.sql
```

Replace `user1.sql` with any user file (user1.sql through user15.sql).

## Test User Credentials

All users are created with the password: `password123`

## User List

1. Alex Johnson (`user1@example.com`)
2. Beth Smith (`user2@example.com`)
3. Charlie Davis (`user3@example.com`)
4. Diana Wilson (`user4@example.com`)
5. Edward Martinez (`user5@example.com`)
6. Fiona Taylor (`user6@example.com`)
7. George White (`user7@example.com`)
8. Hannah Brown (`user8@example.com`)
9. Ian Miller (`user9@example.com`)
10. Julia Garcia (`user10@example.com`)
11. Kevin Anderson (`user11@example.com`)
12. Laura Wright (`user12@example.com`)
13. Mike Thompson (`user13@example.com`)
14. Nancy Lee (`user14@example.com`)
15. Oliver Harris (`user15@example.com`) 