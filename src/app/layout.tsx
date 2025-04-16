import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'Taskl.app - Competitive Task Management',
  description: 'A competitive task completion app where users can assign tasks to each other and track performance.',
  openGraph: {
    title: 'Taskl.app - Complete Tasks. Do Laps. Compete.',
    description: 'A competitive task management platform where you can assign tasks, track performance, and rise through the ranks.',
    url: 'https://taskl.app',
    siteName: 'Taskl.app',
    images: [
      {
        url: '/images/taskl-social-banner.png',
        width: 1200,
        height: 630,
        alt: 'Taskl.app - Competitive Task Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taskl.app - Complete Tasks. Do Laps. Compete.',
    description: 'A competitive task management platform where you can assign tasks, track performance, and rise through the ranks.',
    images: ['/images/taskl-social-banner.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Racing+Sans+One&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
} 