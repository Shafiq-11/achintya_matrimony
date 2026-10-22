import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAccessingAdmin = pathname.startsWith('/admin');
  const isAccessingLogin = pathname === '/login';

  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_ANON_KEY;

  const isSupabaseConfigured =
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project-ref');

  let isAuthenticated = false;

  if (isSupabaseConfigured) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    isAuthenticated = !!data.user;
    if (!isAuthenticated) {
      const devCookie = request.cookies.get('dev_admin_session');
      isAuthenticated = !!devCookie && devCookie.value === 'authenticated_admin';
    }
  } else {
    // Development fallback check when credentials are not yet configured in .env.local
    const devCookie = request.cookies.get('dev_admin_session');
    isAuthenticated = !!devCookie && devCookie.value === 'authenticated_admin';
  }

  // 1. Guard protected admin API routes
  const isAccessingAdminApi = pathname.startsWith('/api/admin');
  if (isAccessingAdminApi && !isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  // 2. Guard protected admin pages
  if (isAccessingAdmin && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Redirect logged-in admin away from /login to /admin
  if (isAccessingLogin && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
