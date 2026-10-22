import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const response = NextResponse.json({ success: true, redirectTo: '/login' });

    try {
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    } catch (e) {
      console.warn('Supabase signout notice:', e);
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
