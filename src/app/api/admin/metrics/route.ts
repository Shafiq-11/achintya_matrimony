import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// Helper to get date string (YYYY-MM-DD) in Asia/Kolkata timezone
function getIstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Helper to compute date range for predefined periods in IST
function getPeriodRange(period: string, customStart?: string | null, customEnd?: string | null) {
  const todayStr = getIstDateString();
  const [y, m, d] = todayStr.split('-').map(Number);

  if (period === 'this_week') {
    // Current date at noon UTC to compute day-of-week safely
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(dateObj);
    monday.setUTCDate(dateObj.getUTCDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const start = monday.toISOString().split('T')[0];
    const end = sunday.toISOString().split('T')[0];
    return {
      start,
      end,
      label: 'Registrations This Week',
    };
  }

  if (period === 'this_month') {
    const mm = String(m).padStart(2, '0');
    const start = `${y}-${mm}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const end = `${y}-${mm}-${String(lastDay).padStart(2, '0')}`;
    return {
      start,
      end,
      label: 'Registrations This Month',
    };
  }

  if (period === 'custom' && customStart && customEnd) {
    return {
      start: customStart,
      end: customEnd,
      label: 'Registrations in Selected Period',
    };
  }

  // Default: Today
  return {
    start: todayStr,
    end: todayStr,
    label: 'Registered Today',
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    if (period === 'custom' && customStart && customEnd && customStart > customEnd) {
      return NextResponse.json(
        { success: false, error: 'Start date cannot be after end date.' },
        { status: 400 }
      );
    }



    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase database is not configured. Live database connection is required.',
        },
        { status: 503 }
      );
    }

    const adminClient = createAdminClient();
    const supabase = adminClient || (await createClient());

    const todayStr = getIstDateString();
    const { start, end, label: periodLabel } = getPeriodRange(period, customStart, customEnd);

    // 1. Authoritative Total Members count (All-time, no joins)
    const { count: totalMembers, error: totalError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total members:', totalError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve authoritative member count.' },
        { status: 500 }
      );
    }

    // 2. Gender breakdown from actual records
    const { count: maleCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Male');

    const { count: femaleCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Female');

    // Matched Users count
    const { count: matchedCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('profile_status', 'matched');

    // Inactive Members count
    const { count: inactiveCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .in('profile_status', ['inactive', 'archived']);

    // Active Prospective Members count
    const { count: activeMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .not('profile_status', 'in', '("matched","inactive","archived")');

    // 3. Today's Tasks: Pending follow-ups scheduled for today (in IST)
    const { count: todaysTasks, error: todayTaskError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('scheduled_date', todayStr);

    if (todayTaskError) {
      console.error('Error fetching today tasks:', todayTaskError);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve today's tasks." },
        { status: 500 }
      );
    }

    // 4. Overdue Tasks: Pending follow-ups scheduled before today (in IST)
    const { count: overdueTasks, error: overdueError } = await supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('scheduled_date', todayStr);

    if (overdueError) {
      console.error('Error fetching overdue tasks:', overdueError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve overdue tasks.' },
        { status: 500 }
      );
    }

    // 5. Registrations in Selected Period (using IST timezone boundaries)
    const startIso = `${start}T00:00:00+05:30`;
    const endIso = `${end}T23:59:59.999+05:30`;

    const { count: periodRegistrations, error: periodError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (periodError) {
      console.error('Error fetching period registrations:', periodError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve period registration count.' },
        { status: 500 }
      );
    }

    // 6. Registration Trend Data for Charts (Last 7 Days in IST)
    const { data: allMembersData } = await supabase
      .from('members')
      .select('id, created_at, gender, profile_status, location_city')
      .order('created_at', { ascending: true });

    // Build last 7 days trend buckets
    const trendBuckets: Array<{ date: string; label: string; count: number; grooms: number; brides: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = getIstDateString(d);
      const label = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      }).format(d);

      let dayTotal = 0;
      let dayGrooms = 0;
      let dayBrides = 0;

      if (allMembersData) {
        allMembersData.forEach((m) => {
          if (m.created_at) {
            const mDate = getIstDateString(new Date(m.created_at));
            if (mDate === dayStr) {
              dayTotal++;
              if (m.gender === 'Male') dayGrooms++;
              if (m.gender === 'Female') dayBrides++;
            }
          }
        });
      }

      trendBuckets.push({
        date: dayStr,
        label,
        count: dayTotal,
        grooms: dayGrooms,
        brides: dayBrides,
      });
    }

    // 7. Today's and Upcoming Agenda / Follow-up Tasks for the right panel
    const { data: followUpsData } = await supabase
      .from('follow_ups')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        notes,
        status,
        purpose,
        member:members (
          id,
          reg_id,
          full_name,
          gender,
          phone
        )
      `)
      .order('scheduled_date', { ascending: true })
      .limit(6);

    return NextResponse.json({
      success: true,
      metrics: {
        totalMembers: totalMembers ?? 0,
        matchedCount: matchedCount ?? 0,
        inactiveCount: inactiveCount ?? 0,
        activeMembers: activeMembers ?? 0,
        todaysTasks: todaysTasks ?? 0,
        overdueTasks: overdueTasks ?? 0,
        periodRegistrations: periodRegistrations ?? 0,
        periodLabel,
        period,
        startDate: start,
        endDate: end,
        maleCount: maleCount ?? 0,
        femaleCount: femaleCount ?? 0,
        trend: trendBuckets,
        tasks: followUpsData || [],
      },
      isLive: true,
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
    console.error('Failed to fetch dashboard metrics:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve metrics from database.' },
      { status: 500 }
    );
  }
}
