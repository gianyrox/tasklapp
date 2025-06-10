# Confy Configuration System

> **CURSOR AI NOTE**: This is a configuration context system. When `@confy` is mentioned in prompts, use this as a reference for understanding the application's data structure and functionality. Do not modify these files unless explicitly instructed to update the configuration system itself.

This folder contains the core configuration and schema definitions for the TasklApp.app application. It serves as the central source of truth for data types, database schema, and context that provides application state management.

## @comfy Tag Usage

This folder is meant to be used with the @comfy tag in cursor prompts. When using @comfy in your cursor prompts, you're referring to this configuration system that provides:

1. Database schema definitions
2. Type-safe TypeScript interfaces
3. Context provider for app-wide state management
4. Utility functions for data transformation

Example usage in cursor: `@comfy how do I create a new task in the system?`

## Core Components

### Database Schema (schema.sql)

The database schema defines the SQL structure for our Supabase backend, including:
- Tables for users, tasks, friendships, and attachments
- Database functions for specialized queries
- Row-level security policies
- Indexes for performance optimization

### TypeScript Schema (schema.ts)

Contains Zod schema definitions that validate and provide type safety for database operations:
- Defines schemas for database objects
- Creates TypeScript types from Zod schemas
- Provides a typed Supabase client
- Maps database schema to TypeScript for type safety

### Application Types (types.ts)

Defines the TypeScript interfaces used throughout the application:
- User-facing data types
- Enums for status values
- API response types
- Form input types
- Type mappers for data transformation

### Configuration Context (confyContext.tsx)

A React context that provides:
- Authentication state and functions
- Task management operations
- Friendship management
- Leaderboard functionality
- UI configuration options
- Data transformation between database and UI formats

## Usage Guidelines

### Importing Types

```typescript
import { User, Task, TaskStatus } from '@/confy/types';
```

### Using the Context

```typescript
import { useConfy } from '@/confy/confyContext';

function MyComponent() {
  const { currentUser, tasks, createTask } = useConfy();
  
  // Now you can use these in your component
}
```

### Protected Routes

```typescript
import { withConfyAuth } from '@/confy/confyContext';

const ProtectedComponent = () => {
  // Component code
};

export default withConfyAuth(ProtectedComponent);
```

### Database Operations

```typescript
import { createTypedSupabaseClient } from '@/confy/schema';

const supabase = createTypedSupabaseClient();
// Now you have type-safe database operations
```

## Configuration Values

| Setting | Default Value | Description |
|---------|---------------|-------------|
| Theme | 'light' | UI theme (light/dark) |
| Language | 'en' | Application language |
| Notifications | true | Enable/disable notifications |
| Default Task Due Days | 7 | Default number of days for task due dates |
| App Version | '1.0.0' | Current application version |
| App Name | 'TasklApp.app' | Application name |

## Data Flow

1. Data is stored in Supabase following the schema.sql structure
2. The confyContext fetches data and transforms it to application types
3. Components consume the transformed data via the context
4. Actions in components call context methods
5. Context methods transform data back to database format and send to Supabase
6. Data is validated using Zod schemas

## Extending the System

When adding new features:

1. First update schema.sql with any new tables or fields
2. Update schema.ts with corresponding Zod schemas
3. Add new interfaces to types.ts
4. Extend the confyContext with new state and methods
5. Document the changes in this file 