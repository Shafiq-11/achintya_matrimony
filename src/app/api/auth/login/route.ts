import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Both email and password are required.' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const isSupabaseConfigured =
      !!supabaseUrl &&
      !!supabaseAnonKey &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    const response = NextResponse.json({ success: true, redirectTo: '/admin' });

    if (isSupabaseConfigured) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Invalid email or password.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: { id: data.user.id, email: data.user.email },
        redirectTo: '/admin',
      });
    } else {
      // Development mode fallback when Supabase credentials are not yet set
      console.warn(
        '[Dev Auth Mode] Supabase credentials not set in .env.local. Authenticating in dev mode.'
      );
      response.cookies.set('dev_admin_session', 'authenticated_admin', {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
      });

      return response;
    }
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
