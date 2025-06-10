# Confy - Task App Configuration System

A comprehensive configuration and state management system for the TasklApp.app task management application. This folder serves as the central hub for type definitions, database schema, and application state management.

## Overview

Confy brings together all the essential configuration elements of our application:

- **Database Schema**: SQL definitions for our Supabase backend
- **TypeScript Types**: Type definitions for all application data structures
- **React Context**: Global state management with typed API
- **Configuration Management**: Central system for app settings

## Features

- **Type Safety**: End-to-end type safety from database to UI
- **Centralized Configuration**: Single source of truth for app settings
- **State Management**: Comprehensive React context with authentication, tasks, friendships, and more
- **Cursor Integration**: Use with @comfy tag in Cursor prompts

## Getting Started

### Installation

This module is included in the main app repository. No separate installation is required.

### Basic Usage

Import and use the context in your components:

```tsx
import { useConfy } from '@/confy/confyContext';

function TaskList() {
  const { tasks, fetchTasks } = useConfy();
  
  // Component implementation
}
```

### Protected Routes

Wrap components that require authentication:

```tsx
import { withConfyAuth } from '@/confy/confyContext';

const Dashboard = () => {
  // Dashboard implementation
};

export default withConfyAuth(Dashboard);
```

### Type Imports

Import types for use in your components:

```tsx
import { Task, TaskStatus, User } from '@/confy/types';

function TaskItem({ task }: { task: Task }) {
  // Component implementation
}
```

## Cursor Integration

This configuration system is designed to work with Cursor prompts using the @comfy tag. Simply use `@comfy` in your prompts to reference this system:

```
@comfy how do I create a new task in the system?
```

## Structure

- `confyContext.tsx`: React context provider with application state and functions
- `schema.sql`: SQL database schema for Supabase
- `schema.ts`: TypeScript schema definitions using Zod
- `types.ts`: TypeScript interfaces and types
- `confy.md`: Detailed documentation of the configuration system

## Core Functionality

### Authentication

- User sign up, sign in, and sign out
- Profile management
- Session persistence

### Task Management

- Create, read, update, and delete tasks
- Task assignment
- Task submission and evaluation
- File attachments

### Friendship System

- Send and accept friend requests
- View friends' tasks
- Assign tasks to friends

### Leaderboard

- View user rankings
- Track task completion metrics
- Compare performance with friends

### UI Configuration

- Theme switching (light/dark)
- Language preferences
- Notification settings

## Contributing

When extending the system:

1. Add new tables or fields to `schema.sql`
2. Update type definitions in `schema.ts` and `types.ts`
3. Add new state or methods to `confyContext.tsx`
4. Document changes in `confy.md`

## License

This system is part of the main TasklApp.app application and is covered by its license. 