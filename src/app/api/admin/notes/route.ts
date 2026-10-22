import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { devSampleNotes, devSampleMembers } from '@/lib/data/devSamples';
import type { Note } from '@/lib/types';

function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request: Request) {
  try {
    const { memberId, content } = await request.json();

    if (!memberId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Both member ID and note content are required.' },
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

      // Retrieve authenticated user email
      const { data: authData } = await supabase.auth.getUser();
      const authorEmail = authData?.user?.email || 'admin@achintyamatrimony.com';

      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          member_id: actualMemberId,
          content: content.trim(),
          author_email: authorEmail,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Supabase note insert error:', error);
        return NextResponse.json(
          { error: 'Failed to record note.' },
          { status: 500 }
        );
      }

      try {
        revalidatePath('/admin');
        if (actualMemberId) {
          revalidatePath(`/admin/members/${actualMemberId}`);
        }
      } catch {}

      return NextResponse.json({ success: true, note });
    } else {
      // In-memory dev mode append
      let actualMemberId = memberId;
      const found = devSampleMembers.find((m) => m.id === memberId || m.reg_id === memberId);
      if (found) actualMemberId = found.id;

      const newNote: Note = {
        id: `note-${Date.now()}`,
        member_id: actualMemberId,
        content: content.trim(),
        author_email: 'admin@achintyamatrimony.com',
        created_at: new Date().toISOString(),
      };

      devSampleNotes.unshift(newNote);

      return NextResponse.json({ success: true, note: newNote });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/notes POST error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving note.' },
      { status: 500 }
    );
  }
}
