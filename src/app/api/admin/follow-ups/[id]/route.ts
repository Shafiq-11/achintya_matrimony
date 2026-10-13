import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { devSampleFollowUps } from '@/lib/data/devSamples';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      !!supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    const updatePayload: Record<string, unknown> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (body.status === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    } else if (body.status === 'pending') {
      updatePayload.completed_at = null;
    }

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      const { data: updated, error } = await supabase
        .from('follow_ups')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase follow-up update error:', error);
        return NextResponse.json(
          { error: 'Failed to update follow-up task.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, task: updated });
    } else {
      // In-memory dev mode update
      const index = devSampleFollowUps.findIndex((t) => t.id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
      }

      devSampleFollowUps[index] = {
        ...devSampleFollowUps[index],
        ...updatePayload,
      };

      return NextResponse.json({
        success: true,
        task: devSampleFollowUps[index],
      });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/follow-ups/[id] PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to update task.' },
      { status: 500 }
    );
  }
}
