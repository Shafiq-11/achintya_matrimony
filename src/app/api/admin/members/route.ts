import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleMembers } from '@/lib/data/devSamples';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const gender = searchParams.get('gender') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      let query = supabase.from('members').select('*');

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,phone.ilike.%${search}%,reg_id.ilike.%${search}%,location_city.ilike.%${search}%`
        );
      }

      if (gender) {
        query = query.eq('gender', gender);
      }

      if (status) {
        query = query.eq('profile_status', status);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Supabase members fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch members list.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, members: data || [] });
    } else {
      // Development mode in-memory filtering
      let filtered = [...devSampleMembers];

      if (search) {
        filtered = filtered.filter(
          (m) =>
            m.full_name.toLowerCase().includes(search) ||
            m.phone.includes(search) ||
            m.reg_id.toLowerCase().includes(search) ||
            m.location_city.toLowerCase().includes(search)
        );
      }

      if (gender) {
        filtered = filtered.filter((m) => m.gender === gender);
      }

      if (status) {
        filtered = filtered.filter((m) => m.profile_status === status);
      }

      filtered.sort((a, b) => {
        if (sortBy === 'full_name') {
          return sortOrder === 'asc'
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name);
        }
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return NextResponse.json({ success: true, members: filtered });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/members error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve members.' },
      { status: 500 }
    );
  }
}
