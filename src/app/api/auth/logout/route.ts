import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = NextResponse.json({ success: true, redirectTo: '/login' });

    const isSupabaseConfigured =
      !!supabaseUrl &&
      !!supabaseAnonKey &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

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

      await supabase.auth.signOut();
    }

    // Always clear dev session cookie if present
    response.cookies.delete('dev_admin_session');

    return response;
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: 'An unexpected logout error occurred.' },
      { status: 500 }
    );
  }
}
