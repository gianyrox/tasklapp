# Taskl.app - Turn Tasks into Laps

A modern, edtech-focused task management application built with Next.js and Supabase that transforms ordinary task completion into a competitive race. Complete tasks, do laps, and compete on the leaderboard!

## 🏁 Features

- **Track Access**: Secure login and signup with Supabase Auth
- **Race Dashboard**: View your tasks, competitors' progress, and leaderboard all in one place
- **Lap Management**: Create, update, and track the status of your tasks as you complete each lap
- **Racing Team**: Connect with friends and challenge each other with task assignments
- **Victory Stand**: Compete for top positions on various performance-based leaderboards
- **Multi-surface Racing**: Responsive design works on desktop, tablet, and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 13+ with App Router, React, TypeScript
- **Backend**: Supabase (PostgreSQL database with real-time capabilities)
- **Styling**: CSS Modules with custom styling (no Tailwind)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (frontend) and Supabase (backend)

## 📝 Recent Improvements to Your Racing Experience

### Race Circuits
- Added route for racer profiles: `/user/[userId]`
- Added route for lap details: `/task/[taskId]`
- Added route for team members: `/friend/[friendId]`
- Added route for leaderboard categories: `/leaderboard/[leaderboardId]`

### Track Enhancements
- Updated dashboard with racing-inspired visuals and edtech-focused styling
- Added performance metrics cards for real-time progress tracking
- Enhanced victory stand display with improved ranking visualization
- Improved starting line (empty states) with actionable prompts
- Added dynamic hover effects and transitions for a more interactive racing experience

### Lap Management
- Added lap creation functionality from multiple locations:
  - Add tasks to your personal circuit
  - Challenge team members with tasks directly from your dashboard
  - Create tasks from team member profile pages
- Updated lap status tracking with visual progress indicators
- Enhanced lap detail views with better organization of performance data

### Racing Team System
- Improved team member profile pages with challenge capability
- Added direct task assignments to push your teammates
- Enhanced team roster display in dashboard

### Other Track Improvements
- Added loading states throughout the racing experience
- Improved error handling and racer feedback
- Enhanced mobile responsiveness for racing on-the-go
- Updated color scheme with vibrant track-inspired visuals

## 📱 Race Photos

[Screenshots will be added here]

## 🏎️ Getting Started

### Pre-race Checklist
- Node.js 16+ 
- npm or yarn

### Pit Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/task-app.git
cd task-app
```

2. Install racing equipment
```bash
npm install
# or
yarn
```

3. Set up your pit credentials
Create a `.env.local` file and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start your engines
```bash
npm run dev
# or
yarn dev
```

5. Head to the starting line at [http://localhost:3000](http://localhost:3000)

## 🏆 Race Rules

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙌 Racing Team Sponsors

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [React](https://reactjs.org/) 