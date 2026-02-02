import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { LogCategory } from '../../../../../../confy/types';

// This is the main callback handler which processes redirects from Supabase Auth
// It exchanges the code for a session and sets the auth cookies
// NOTE: With OTP authentication, most verification happens directly on the login/signup pages.
// This route primarily handles OAuth providers (Google, GitHub, etc.) and legacy magic link flows.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard';
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  
  // Create server-side Supabase client with correct cookie handling for Next.js 15.3
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
  
  console.log('Auth callback route handler called', { 
    url: requestUrl.pathname, 
    hasCode: Boolean(code),
    redirectTo,
    hasTokenHash: Boolean(tokenHash),
    type
  });
  
  // Try to create log entry
  try {
    const { error: logError } = await supabase.from('logs').insert({
      category: LogCategory.AUTH,
      action: 'auth_callback_route_handler',
      details: { 
        hasCode: Boolean(code),
        hasTokenHash: Boolean(tokenHash),
        type,
        pathname: requestUrl.pathname,
        query: Object.fromEntries(requestUrl.searchParams.entries()),
        timestamp: new Date().toISOString()
      }
    });
    
    if (logError) {
      console.error('Error logging auth callback:', logError);
    }
  } catch (e) {
    console.error('Exception logging auth callback:', e);
  }
  
  // Handle token hash verification for PKCE flow
  if (tokenHash && type) {
    try {
      console.log('Verifying OTP with token hash');
      
      // Log token hash verification attempt
      await supabase.from('logs').insert({
        category: LogCategory.AUTH,
        action: 'auth_verify_token_hash',
        details: { 
          type,
          timestamp: new Date().toISOString()
        }
      });
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });
      
      if (error) {
        console.error('Error verifying token hash:', error);
        
        // Log the error
        await supabase.from('logs').insert({
          category: LogCategory.ERROR,
          action: 'auth_token_hash_verification_error',
          details: { error: error.message }
        });
        
        return NextResponse.redirect(new URL(`/login?error=token_verification&message=${encodeURIComponent(error.message)}`, request.url));
      }
      
      if (!data.session) {
        console.error('No session returned after token hash verification');
        
        // Log the error
        await supabase.from('logs').insert({
          category: LogCategory.ERROR,
          action: 'auth_token_hash_no_session',
          details: { hasUser: Boolean(data.user) }
        });
        
        return NextResponse.redirect(new URL('/login?error=no_session', request.url));
      }
      
      console.log('Token hash verification successful, session established');
      
      // Log success
      await supabase.from('logs').insert({
        category: LogCategory.AUTH,
        action: 'auth_token_hash_success',
        userId: data.session.user.id,
        details: { 
          provider: data.session.user.app_metadata?.provider,
          redirectTo,
          expiresAt: data.session.expires_at,
        }
      });
      
      // Set cache control headers to prevent caching
      const response = NextResponse.redirect(new URL(redirectTo, request.url));
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } catch (error) {
      console.error('Error in token hash verification:', error);
      
      // Log the error
      try {
        await supabase.from('logs').insert({
          category: LogCategory.ERROR,
          action: 'auth_token_hash_exception',
          details: { error: String(error) }
        });
      } catch (e) {
        console.error('Failed to log error:', e);
      }
      
      // Redirect to login page with error
      return NextResponse.redirect(new URL('/login?error=token_hash_error', request.url));
    }
  }
  
  // Handle code exchange
  if (code) {
    try {
      console.log('Exchanging code for session via route handler');
      
      // Log code exchange attempt  
      await supabase.from('logs').insert({
        category: LogCategory.AUTH,
        action: 'auth_exchange_code_attempt',
        details: { 
          timestamp: new Date().toISOString()
        }
      });
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session in route handler:', error);
        
        // Log the error
        await supabase.from('logs').insert({
          category: LogCategory.ERROR,
          action: 'auth_callback_exchange_error',
          details: { 
            error: error.message,
            code: error.code,
            status: error.status
          }
        });
        
        return NextResponse.redirect(new URL(`/login?error=auth_error&message=${encodeURIComponent(error.message)}`, request.url));
      }
      
      if (!data.session) {
        console.error('No session returned after code exchange');
        
        // Log the error
        await supabase.from('logs').insert({
          category: LogCategory.ERROR,
          action: 'auth_callback_no_session',
          details: { hasUser: Boolean(data.user) }
        });
        
        return NextResponse.redirect(new URL('/login?error=no_session', request.url));
      }
      
      console.log('Session successfully set in route handler', { 
        hasSession: Boolean(data.session),
        userId: data.session?.user?.id,
        provider: data.session?.user?.app_metadata?.provider,
        expiresAt: data.session?.expires_at
      });
      
      // Log success
      await supabase.from('logs').insert({
        category: LogCategory.AUTH,
        action: 'auth_callback_success',
        userId: data.session.user.id,
        details: { 
          provider: data.session.user.app_metadata?.provider,
          redirectTo,
          hasRefreshToken: Boolean(data.session.refresh_token),
          expiresAt: data.session.expires_at,
          authMethods: data.session.user.app_metadata?.providers || []
        }
      });
      
      // Set cache control headers to prevent caching
      const response = NextResponse.redirect(new URL(redirectTo, request.url));
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } catch (error) {
      console.error('Error in auth callback route handler:', error);
      
      // Log the error
      try {
        await supabase.from('logs').insert({
          category: LogCategory.ERROR,
          action: 'auth_callback_exception',
          details: { error: String(error) }
        });
      } catch (e) {
        console.error('Failed to log error:', e);
      }
      
      // Redirect to login page with error
      return NextResponse.redirect(new URL('/login?error=callback_error', request.url));
    }
  }
  
  // If we get here, no code or token hash was found
  console.log('No authentication data found in auth callback route');
  await supabase.from('logs').insert({
    category: LogCategory.ERROR,
    action: 'auth_callback_no_auth_data',
    details: { 
      url: requestUrl.pathname,
      query: Object.fromEntries(requestUrl.searchParams.entries())
    }
  });
  
  // Redirect to login page if no authentication data was found
  return NextResponse.redirect(new URL('/login?error=missing_auth_data', request.url));
} 