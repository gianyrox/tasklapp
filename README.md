# Task Management App

A modern, edtech-focused task management application built with Next.js and Supabase that allows users to manage their tasks, assign tasks to friends, and track progress on a leaderboard.

## 🚀 Features

- **User Authentication**: Secure login and signup with Supabase Auth
- **Dashboard**: View your tasks, friend's tasks, and leaderboard all in one place
- **Task Management**: Create, update, and track the status of tasks
- **Friend System**: Connect with friends and assign tasks to each other
- **Leaderboard**: Compete with friends based on task completion
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 13+ with App Router, React, TypeScript
- **Backend**: Supabase (PostgreSQL database with real-time capabilities)
- **Styling**: CSS Modules with custom styling (no Tailwind)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (frontend) and Supabase (backend)

## 📝 Recent Updates

### Dynamic Routes
- Added route for user profiles: `/user/[userId]`
- Added route for task details: `/task/[taskId]`
- Added route for friend profiles: `/friend/[friendId]`
- Added route for leaderboard categories: `/leaderboard/[leaderboardId]`

### UI Improvements
- Updated dashboard with edtech-focused styling
- Added stat cards for quick metrics visualization
- Enhanced leaderboard visuals with improved ranking display
- Improved empty states with actionable prompts
- Added hover effects and transitions for a more interactive experience

### Task Management
- Added task creation functionality from multiple locations:
  - Add tasks to your own list
  - Assign tasks to friends directly from dashboard
  - Create tasks from friend profile pages
- Updated task status management with visual indicators
- Enhanced task detail views with better organization of information

### Friend System
- Improved friend profile pages with task assignment capability
- Added direct task assignment from friend profiles
- Enhanced friend list display in dashboard

### Other Improvements
- Added loading states across the application
- Improved error handling and user feedback
- Enhanced mobile responsiveness
- Updated color scheme to be more vibrant and engaging

## 📱 Screenshots

[Screenshots will be added here]

## 🏁 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/task-app.git
cd task-app
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
Create a `.env.local` file and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [React](https://reactjs.org/) 