import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleMembers } from '@/lib/data/devSamples';
import type { DashboardMetrics } from '@/lib/types';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      // Query members count
      const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      const { count: maleCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('gender', 'Male');

      const { count: femaleCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('gender', 'Female');

      const { count: newRegistrations } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('profile_status', 'new');

      // Query follow-ups
      const todayStr = new Date().toISOString().split('T')[0];

      const { count: callsDueToday } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('scheduled_date', todayStr);

      const { count: callsOverdue } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('scheduled_date', todayStr);

      const { count: callsUpcoming } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gt('scheduled_date', todayStr);

      const metrics: DashboardMetrics = {
        totalMembers: totalMembers || 0,
        maleCount: maleCount || 0,
        femaleCount: femaleCount || 0,
        newRegistrations: newRegistrations || 0,
        callsDueToday: callsDueToday || 0,
        callsOverdue: callsOverdue || 0,
        callsUpcoming: callsUpcoming || 0,
      };

      return NextResponse.json({ success: true, metrics, isLive: true });
    } else {
      // Dev mode metrics calculated dynamically from sample dataset
      const total = devSampleMembers.length;
      const males = devSampleMembers.filter((m) => m.gender === 'Male').length;
      const females = devSampleMembers.filter((m) => m.gender === 'Female').length;
      const newRegs = devSampleMembers.filter((m) => m.profile_status === 'new').length;

      const metrics: DashboardMetrics = {
        totalMembers: total,
        maleCount: males,
        femaleCount: females,
        newRegistrations: newRegs,
        callsDueToday: 1,
        callsOverdue: 0,
        callsUpcoming: 2,
      };

      return NextResponse.json({
        success: true,
        metrics,
        isLive: false,
        message: 'Calculated in local development mode.',
      });
    }
  } catch (err: unknown) {
    console.error('Failed to fetch dashboard metrics:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics.' },
      { status: 500 }
    );
  }
}
