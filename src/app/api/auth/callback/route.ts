import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get('code');
    
    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
    }
    
    // Redirect to the dashboard after processing
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('Error processing auth callback:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', req.url)
    );
  }
} 