import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { devSampleFollowUps, devSampleMembers } from '@/lib/data/devSamples';
import type { FollowUpTask } from '@/lib/types';

function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const memberId = searchParams.get('memberId');

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const supabase = adminClient || (await createClient());

      let targetMemberUuid = memberId;
      if (memberId && !isUuidString(memberId)) {
        const { data: m } = await supabase
          .from('members')
          .select('id')
          .eq('reg_id', memberId)
          .maybeSingle();
        if (m) targetMemberUuid = m.id;
      }

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

      if (targetMemberUuid) {
        query = query.eq('member_id', targetMemberUuid);
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
        const isUuid = isUuidString(memberId);
        const targetMember = devSampleMembers.find((m) =>
          isUuid ? m.id === memberId : m.reg_id === memberId || m.id === memberId
        );
        if (targetMember) {
          tasks = tasks.filter((t) => t.member_id === targetMember.id);
        }
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
    if (
      typeof err === 'object' &&
      err !== null &&
      'digest' in err &&
      typeof (err as { digest: unknown }).digest === 'string'
    ) {
      throw err;
    }
    console.error('API /api/admin/follow-ups GET error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve tasks.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      memberId,
      scheduledDate,
      scheduledTime,
      reason,
      rescheduleTaskId,
    } = await request.json();

    if (!memberId || !scheduledDate || !reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Member ID, scheduled date, and reason are required.' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const supabase = adminClient || (await createClient());

      // Resolve member UUID if a reg_id (e.g., AM-1007) was passed
      let actualMemberId = memberId;
      if (!isUuidString(memberId)) {
        const { data: memberRecord } = await supabase
          .from('members')
          .select('id')
          .eq('reg_id', memberId)
          .maybeSingle();

        if (!memberRecord) {
          return NextResponse.json({ error: 'Member record not found.' }, { status: 404 });
        }
        actualMemberId = memberRecord.id;
      }

      const { data: authData } = await supabase.auth.getUser();
      const authorEmail = authData?.user?.email || 'admin@achintyamatrimony.com';

      // If rescheduling an existing pending task, update old task to prevent confusing duplicate active tasks
      if (rescheduleTaskId) {
        await supabase
          .from('follow_ups')
          .update({
            status: 'cancelled',
            reason: `Rescheduled to ${scheduledDate}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rescheduleTaskId);
      }

      const { data: task, error } = await supabase
        .from('follow_ups')
        .insert({
          member_id: actualMemberId,
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

      try {
        revalidatePath('/admin');
        revalidatePath('/admin/tasks');
        if (actualMemberId) {
          revalidatePath(`/admin/members/${actualMemberId}`);
        }
      } catch {}

      return NextResponse.json({ success: true, task });
    } else {
      // In-memory dev mode append
      let actualMemberId = memberId;
      const found = devSampleMembers.find((m) => m.id === memberId || m.reg_id === memberId);
      if (found) actualMemberId = found.id;

      if (rescheduleTaskId) {
        const oldIndex = devSampleFollowUps.findIndex((t) => t.id === rescheduleTaskId);
        if (oldIndex !== -1) {
          devSampleFollowUps[oldIndex].status = 'cancelled';
        }
      }

      const newTask: FollowUpTask = {
        id: `task-${Date.now()}`,
        member_id: actualMemberId,
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
