import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleMembers } from '@/lib/data/devSamples';

// Helper to compute age
function getAgeFromDob(dobStr: string): number {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const gender = searchParams.get('gender') || '';
    const status = searchParams.get('status') || '';
    const minAge = searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!, 10) : null;
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!, 10) : null;
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      let query = supabase.from('members').select('*', { count: 'exact' });

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

      // Age range filtering via DOB
      if (minAge !== null) {
        const maxDob = new Date();
        maxDob.setFullYear(maxDob.getFullYear() - minAge);
        query = query.lte('dob', maxDob.toISOString().split('T')[0]);
      }
      if (maxAge !== null) {
        const minDob = new Date();
        minDob.setFullYear(minDob.getFullYear() - maxAge - 1);
        query = query.gte('dob', minDob.toISOString().split('T')[0]);
      }

      // Sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Supabase members fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch members list.' },
          { status: 500 }
        );
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        members: data || [],
        totalCount,
        page,
        totalPages: totalPages || 1,
        limit,
      });
    } else {
      // In-memory development mode filter & pagination
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

      if (minAge !== null) {
        filtered = filtered.filter((m) => getAgeFromDob(m.dob) >= minAge);
      }

      if (maxAge !== null) {
        filtered = filtered.filter((m) => getAgeFromDob(m.dob) <= maxAge);
      }

      filtered.sort((a, b) => {
        if (sortBy === 'full_name') {
          return sortOrder === 'asc'
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name);
        }
        if (sortBy === 'reg_id') {
          return sortOrder === 'asc'
            ? a.reg_id.localeCompare(b.reg_id)
            : b.reg_id.localeCompare(a.reg_id);
        }
        if (sortBy === 'dob') {
          return sortOrder === 'asc'
            ? new Date(a.dob).getTime() - new Date(b.dob).getTime()
            : new Date(b.dob).getTime() - new Date(a.dob).getTime();
        }
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const totalCount = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      const from = (page - 1) * limit;
      const paginated = filtered.slice(from, from + limit);

      return NextResponse.json({
        success: true,
        members: paginated,
        totalCount,
        page,
        totalPages,
        limit,
      });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/members error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve members.' },
      { status: 500 }
    );
  }
}
