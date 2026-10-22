// Robust Supabase & Admin Configuration with environment variable fallbacks
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref')
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : 'https://htbnccizphoeeiqeoxui.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Ym5jY2l6cGhvZWVpcWVveHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTQ4NjUsImV4cCI6MjEwNzU3MDg2NX0.yj3WnF499GkvEHpHaaFucU5aOn69NSr4dSHy0bdCZFY';

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Ym5jY2l6cGhvZWVpcWVveHVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk5NDg2NSwiZXhwIjoyMTA3NTcwODY1fQ.Oe0RzaQJon73dCVcgXeNPnHKWC-jDs3VrFSWgCKIbeM';

export const DEV_ADMIN_EMAIL = (
  process.env.DEV_ADMIN_EMAIL || 'admin@achintyamatrimony.com'
).trim().toLowerCase();

export const DEV_ADMIN_PASSWORD =
  process.env.DEV_ADMIN_PASSWORD || 'Achintya@Admin2026';

export const isSupabaseConfigured =
  !!SUPABASE_URL &&
  !SUPABASE_URL.includes('placeholder') &&
  !SUPABASE_URL.includes('your-project-ref');
