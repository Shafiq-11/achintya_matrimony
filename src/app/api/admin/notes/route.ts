import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleNotes } from '@/lib/data/devSamples';
import type { Note } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { memberId, content } = await request.json();

    if (!memberId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Both member ID and note content are required.' },
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

      // Retrieve authenticated user email
      const { data: authData } = await supabase.auth.getUser();
      const authorEmail = authData.user?.email || 'admin@achintyamatrimony.com';

      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          member_id: memberId,
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

      return NextResponse.json({ success: true, note });
    } else {
      // In-memory dev mode append
      const newNote: Note = {
        id: `note-${Date.now()}`,
        member_id: memberId,
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
