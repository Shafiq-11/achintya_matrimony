import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleFollowUps, devSampleMembers } from '@/lib/data/devSamples';
import type { FollowUpTask } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const memberId = searchParams.get('memberId');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      let query = supabase
        .from('follow_ups')
        .select(`
          *,
          member:members (
            id,
            reg_id,
            full_name,
            phone,
            gender
          )
        `);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (memberId) {
        query = query.eq('member_id', memberId);
      }

      query = query.order('scheduled_date', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Supabase follow-ups fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch follow-ups.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, tasks: data || [] });
    } else {
      // In-memory dev mode
      let tasks = [...devSampleFollowUps];

      if (status !== 'all') {
        tasks = tasks.filter((t) => t.status === status);
      }

      if (memberId) {
        tasks = tasks.filter((t) => t.member_id === memberId);
      }

      // Attach mock member info
      const enriched = tasks.map((t) => {
        const member = devSampleMembers.find((m) => m.id === t.member_id);
        return {
          ...t,
          member: member
            ? {
                id: member.id,
                reg_id: member.reg_id,
                full_name: member.full_name,
                phone: member.phone,
                gender: member.gender,
              }
            : undefined,
        };
      });

      enriched.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

      return NextResponse.json({ success: true, tasks: enriched });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/follow-ups GET error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve tasks.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { memberId, scheduledDate, scheduledTime, reason } = await request.json();

    if (!memberId || !scheduledDate || !reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Member ID, scheduled date, and reason are required.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      const { data: authData } = await supabase.auth.getUser();
      const authorEmail = authData.user?.email || 'admin@achintyamatrimony.com';

      const { data: task, error } = await supabase
        .from('follow_ups')
        .insert({
          member_id: memberId,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime || null,
          reason: reason.trim(),
          status: 'pending',
          author_email: authorEmail,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Supabase follow-up insert error:', error);
        return NextResponse.json(
          { error: 'Failed to schedule follow-up.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, task });
    } else {
      // In-memory dev mode append
      const newTask: FollowUpTask = {
        id: `task-${Date.now()}`,
        member_id: memberId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        reason: reason.trim(),
        status: 'pending',
        author_email: 'admin@achintyamatrimony.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      devSampleFollowUps.push(newTask);

      return NextResponse.json({ success: true, task: newTask });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/follow-ups POST error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while scheduling task.' },
      { status: 500 }
    );
  }
}
