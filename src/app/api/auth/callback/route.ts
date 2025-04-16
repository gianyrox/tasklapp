import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get('code');
    
    console.log('API auth callback route handler called', { 
      url: requestUrl.pathname, 
      hasCode: Boolean(code)
    });
    
    if (code) {
      // Create supabase client with correct cookie handling for Next.js 15.3
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              const cookie = cookieStore.get(name);
              return cookie?.value;
            },
            set(name, value, options) {
              try {
                cookieStore.set(name, value, {
                  ...options,
                  maxAge: options?.maxAge ?? 0,
                  path: options?.path ?? '/'
                });
              } catch (error) {
                // Handle edge cases
                console.error('Error setting cookie:', error);
              }
            },
            remove(name, options) {
              try {
                cookieStore.set(name, '', { 
                  ...options, 
                  maxAge: 0,
                  path: options?.path ?? '/' 
                });
              } catch (error) {
                console.error('Error removing cookie:', error);
              }
            },
          },
        }
      );
      
      console.log('API route: Exchanging code for session');
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('API route: Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL('/login?error=callback_error', req.url)
        );
      }
      
      console.log('API route: Session set successfully', {
        hasSession: Boolean(data?.session),
        userId: data?.session?.user?.id
      });
    }
    
    // Redirect to the dashboard after processing
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error processing auth callback:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', req.url)
    );
  }
} 