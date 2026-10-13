import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleMembers } from '@/lib/data/devSamples';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      const { data: member, error: memberErr } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (memberErr || !member) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }

      // Fetch notes
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false });

      // Fetch follow-ups
      const { data: followUps } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('member_id', id)
        .order('scheduled_date', { ascending: false });

      return NextResponse.json({
        success: true,
        member,
        notes: notes || [],
        followUps: followUps || [],
      });
    } else {
      // Dev mode lookup
      const member = devSampleMembers.find((m) => m.id === id || m.reg_id === id);
      if (!member) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        member,
        notes: [
          {
            id: 'note-1',
            member_id: member.id,
            content: 'Spoke with candidate and parents. Very receptive to referral introductions.',
            author_email: 'admin@achintyamatrimony.com',
            created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          },
        ],
        followUps: [
          {
            id: 'task-1',
            member_id: member.id,
            scheduled_date: new Date().toISOString().split('T')[0],
            scheduled_time: '15:00:00',
            reason: 'Introductory follow-up call regarding horoscope and partner expectations.',
            status: 'pending',
            created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/members/[id] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve member details.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      const { data: updated, error } = await supabase
        .from('members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase member update error:', error);
        return NextResponse.json(
          { error: 'Failed to update member.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, member: updated });
    } else {
      // Dev mode update in memory
      const index = devSampleMembers.findIndex((m) => m.id === id || m.reg_id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }

      devSampleMembers[index] = {
        ...devSampleMembers[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        member: devSampleMembers[index],
      });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/members/[id] PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to update member profile.' },
      { status: 500 }
    );
  }
}
