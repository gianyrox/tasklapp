/// <reference types="https://deno.land/x/types/index.d.ts" />
// @deno-types="jsr:@supabase/functions-js/edge-runtime.d.ts"

// Supabase Edge Function for email notifications
// This runs on Deno runtime - TypeScript linting works when deployed

// @ts-ignore - Deno globals available in Supabase runtime
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

interface TaskAssignmentNotification {
  assigneeEmail: string;
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  taskId: string;
}

// @ts-ignore - Deno.serve available in Supabase runtime
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }

  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  };

  try {
    // Parse the request body
    const { 
      assigneeEmail, 
      assigneeName, 
      assignerName, 
      taskTitle, 
      taskDescription, 
      dueDate, 
      taskId 
    }: TaskAssignmentNotification = await req.json()

    // Validate required fields
    if (!assigneeEmail || !assigneeName || !assignerName || !taskTitle || !taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Format the due date
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // @ts-ignore - Deno.env available in Supabase runtime
    const appUrl = Deno.env.get('APP_URL') || 'https://taskl.app';

    // Create the email HTML content
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Task Assignment</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .task-card {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          border-left: 4px solid #3b82f6;
        }
        .task-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e40af;
          margin: 0 0 12px 0;
        }
        .task-description {
          color: #64748b;
          margin: 0 0 16px 0;
        }
        .task-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }
        .due-date {
          background: #fef3c7;
          color: #92400e;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
        }
        .cta-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          margin: 24px 0;
          transition: background 0.2s;
        }
        .cta-button:hover {
          background: #2563eb;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 16px;
        }
        .message {
          color: #4b5563;
          margin-bottom: 24px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Task Assignment</h1>
        </div>
        
        <div class="greeting">
          Hi ${assigneeName}! 👋
        </div>
        
        <div class="message">
          You've been assigned a new task by <strong>${assignerName}</strong>. Here are the details:
        </div>
        
        <div class="task-card">
          <div class="task-title">${taskTitle}</div>
          ${taskDescription ? `<div class="task-description">${taskDescription}</div>` : ''}
          <div class="task-meta">
            <div class="due-date">
              📅 Due: ${formattedDueDate}
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${appUrl}/task/${taskId}" class="cta-button">
            View Task Details
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from your TaskLapp system.</p>
          <p>If you have any questions, please contact ${assignerName} directly.</p>
        </div>
      </div>
    </body>
    </html>
    `

    // Send the email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TaskLapp <notifications@taskl.app>',
        to: assigneeEmail,
        subject: `New Task: ${taskTitle}`,
        html,
      }),
    })

    const data = await res.json()
    
    if (!res.ok) {
      console.error('Failed to send email:', data)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }), 
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    console.log('Email sent successfully:', data)
    return new Response(
      JSON.stringify({ success: true, data }), 
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error) {
    console.error('Error in notify-task-assignment function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}) 