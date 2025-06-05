/// <reference types="https://deno.land/x/types/index.d.ts" />
// @deno-types="jsr:@supabase/functions-js/edge-runtime.d.ts"

// Supabase Edge Function for email notifications
// This runs on Deno runtime - TypeScript linting works when deployed

// @ts-ignore - Deno globals available in Supabase runtime
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

type NotificationType = 'assignment' | 'completion' | 'grading';

interface BaseNotification {
  type: NotificationType;
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
}

interface TaskAssignmentNotification extends BaseNotification {
  type: 'assignment';
  assigneeEmail: string;
  assigneeName: string;
  assignerName: string;
  dueDate: string;
}

interface TaskCompletionNotification extends BaseNotification {
  type: 'completion';
  assignerEmail: string;
  assignerName: string;
  assigneeName: string;
  completedAt: string;
  submissionContent?: string;
}

interface TaskGradingNotification extends BaseNotification {
  type: 'grading';
  assigneeEmail: string;
  assigneeName: string;
  assignerName: string;
  qualityRating?: number;
  timelinessRating?: number;
  effortRating?: number;
  accuracyRating?: number;
  feedback?: string;
}

type NotificationData = TaskAssignmentNotification | TaskCompletionNotification | TaskGradingNotification;

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
    const notificationData: NotificationData = await req.json();

    // Validate required fields based on notification type
    if (!notificationData.type || !notificationData.taskTitle || !notificationData.taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, taskTitle, taskId' }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // @ts-ignore - Deno.env available in Supabase runtime
    const appUrl = Deno.env.get('APP_URL') || 'https://taskl.app';

    let html: string;
    let subject: string;
    let to: string;

    switch (notificationData.type) {
      case 'assignment':
        const assignmentData = notificationData as TaskAssignmentNotification;
        if (!assignmentData.assigneeEmail || !assignmentData.assigneeName || !assignmentData.assignerName || !assignmentData.dueDate) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for assignment notification' }), 
            { 
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }

        const formattedDueDate = new Date(assignmentData.dueDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        html = createAssignmentEmailTemplate(assignmentData, formattedDueDate, appUrl);
        subject = `New Task: ${assignmentData.taskTitle}`;
        to = assignmentData.assigneeEmail;
        break;

      case 'completion':
        const completionData = notificationData as TaskCompletionNotification;
        if (!completionData.assignerEmail || !completionData.assignerName || !completionData.assigneeName || !completionData.completedAt) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for completion notification' }), 
            { 
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }

        const completedDate = new Date(completionData.completedAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        html = createCompletionEmailTemplate(completionData, completedDate, appUrl);
        subject = `Task Completed: ${completionData.taskTitle}`;
        to = completionData.assignerEmail;
        break;

      case 'grading':
        const gradingData = notificationData as TaskGradingNotification;
        if (!gradingData.assigneeEmail || !gradingData.assigneeName || !gradingData.assignerName) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for grading notification' }), 
            { 
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }

        html = createGradingEmailTemplate(gradingData, appUrl);
        subject = `Task Graded: ${gradingData.taskTitle}`;
        to = gradingData.assigneeEmail;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid notification type' }), 
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
    }

    // Send the email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TaskLapp <notifications@taskl.app>',
        to,
        subject,
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
    console.error('Error in notification function:', error)
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

function createAssignmentEmailTemplate(data: TaskAssignmentNotification, formattedDueDate: string, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Task Assignment</title>
      <style>
        ${getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Task Assignment</h1>
        </div>
        
        <div class="greeting">
          Hi ${data.assigneeName}! 👋
        </div>
        
        <div class="message">
          You've been assigned a new task by <strong>${data.assignerName}</strong>. Here are the details:
        </div>
        
        <div class="task-card">
          <div class="task-title">${data.taskTitle}</div>
          ${data.taskDescription ? `<div class="task-description">${data.taskDescription}</div>` : ''}
          <div class="task-meta">
            <div class="due-date">
              📅 Due: ${formattedDueDate}
            </div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${appUrl}/task/${data.taskId}" class="cta-button">
            View Task Details
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from your TaskLapp system.</p>
          <p>If you have any questions, please contact ${data.assignerName} directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function createCompletionEmailTemplate(data: TaskCompletionNotification, completedDate: string, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Completed</title>
      <style>
        ${getCommonEmailStyles()}
        .completion-card {
          background: #ecfdf5;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          border-left: 4px solid #10b981;
        }
        .completion-badge {
          background: #d1fae5;
          color: #065f46;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Task Completed</h1>
        </div>
        
        <div class="greeting">
          Hi ${data.assignerName}! 👋
        </div>
        
        <div class="message">
          Great news! <strong>${data.assigneeName}</strong> has completed the task you assigned to them.
        </div>
        
        <div class="completion-card">
          <div class="task-title">${data.taskTitle}</div>
          ${data.taskDescription ? `<div class="task-description">${data.taskDescription}</div>` : ''}
          <div class="task-meta">
            <div class="completion-badge">
              ✓ Completed: ${completedDate}
            </div>
          </div>
          ${data.submissionContent ? `
            <div style="margin-top: 16px;">
              <strong>Submission:</strong>
              <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-top: 8px;">
                ${data.submissionContent}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${appUrl}/task/${data.taskId}" class="cta-button" style="background: #10b981;">
            Review & Grade Task
          </a>
        </div>
        
        <div class="footer">
          <p>You can now review the submission and provide feedback or ratings.</p>
          <p>This is an automated notification from your TaskLapp system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function createGradingEmailTemplate(data: TaskGradingNotification, appUrl: string): string {
  const hasRatings = data.qualityRating || data.timelinessRating || data.effortRating || data.accuracyRating;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Graded</title>
      <style>
        ${getCommonEmailStyles()}
        .grading-card {
          background: #fef3c7;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          border-left: 4px solid #f59e0b;
        }
        .rating-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        .rating-item {
          background: #fef9c3;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
        }
        .rating-label {
          font-size: 12px;
          color: #92400e;
          margin-bottom: 4px;
        }
        .rating-value {
          font-size: 18px;
          font-weight: 600;
          color: #92400e;
        }
        .feedback-section {
          background: #f8fafc;
          padding: 16px;
          border-radius: 6px;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⭐ Task Graded</h1>
        </div>
        
        <div class="greeting">
          Hi ${data.assigneeName}! 👋
        </div>
        
        <div class="message">
          <strong>${data.assignerName}</strong> has reviewed and graded your completed task.
        </div>
        
        <div class="grading-card">
          <div class="task-title">${data.taskTitle}</div>
          ${data.taskDescription ? `<div class="task-description">${data.taskDescription}</div>` : ''}
          
          ${hasRatings ? `
            <div class="rating-grid">
              ${data.qualityRating ? `
                <div class="rating-item">
                  <div class="rating-label">Quality</div>
                  <div class="rating-value">${data.qualityRating}/5 ⭐</div>
                </div>
              ` : ''}
              ${data.timelinessRating ? `
                <div class="rating-item">
                  <div class="rating-label">Timeliness</div>
                  <div class="rating-value">${data.timelinessRating}/5 ⏰</div>
                </div>
              ` : ''}
              ${data.effortRating ? `
                <div class="rating-item">
                  <div class="rating-label">Effort</div>
                  <div class="rating-value">${data.effortRating}/5 💪</div>
                </div>
              ` : ''}
              ${data.accuracyRating ? `
                <div class="rating-item">
                  <div class="rating-label">Accuracy</div>
                  <div class="rating-value">${data.accuracyRating}/5 🎯</div>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${data.feedback ? `
            <div class="feedback-section">
              <strong>Feedback from ${data.assignerName}:</strong>
              <div style="margin-top: 8px;">${data.feedback}</div>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${appUrl}/task/${data.taskId}" class="cta-button" style="background: #f59e0b;">
            View Full Details
          </a>
        </div>
        
        <div class="footer">
          <p>Thank you for completing this task! Keep up the great work.</p>
          <p>This is an automated notification from your TaskLapp system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getCommonEmailStyles(): string {
  return `
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
  `;
} 