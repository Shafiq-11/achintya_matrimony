import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Check dev admin session cookie
      const cookieStore = await cookies();
      const devCookie = cookieStore.get('dev_admin_session');
      if (devCookie?.value === 'authenticated_admin') {
        const devEmail = process.env.DEV_ADMIN_EMAIL || 'admin@achintyamatrimony.test';
        return NextResponse.json({
          authenticated: true,
          email: devEmail,
          displayName: null, // No configured fake name
        });
      }
      return NextResponse.json({ authenticated: false, displayName: null }, { status: 401 });
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      null;

    return NextResponse.json({
      authenticated: true,
      id: user.id,
      email: user.email,
      displayName,
    });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'digest' in err &&
      typeof (err as { digest: unknown }).digest === 'string'
    ) {
      throw err;
    }
    console.error('Error fetching admin user profile:', err);
    return NextResponse.json({ authenticated: false, displayName: null }, { status: 500 });
  }
}
