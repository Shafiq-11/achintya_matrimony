import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { MemberDetailView } from '@/components/members/MemberDetailView';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { devSampleMembers, devSampleNotes, devSampleFollowUps } from '@/lib/data/devSamples';
import { hydrateMemberV2 } from '@/lib/utils/memberProfile';
import type { Note, FollowUpTask } from '@/lib/types';

export const metadata = {
  title: 'Member Profile Details | Achintya Matrimony CRM',
  description: 'View and manage matrimony member profile.',
};

function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function getMemberData(id: string) {

  if (isSupabaseConfigured) {
    const adminClient = createAdminClient();
    const supabase = adminClient || (await createClient());

    const isUuid = isUuidString(id);
    let query = supabase.from('members').select('*');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('reg_id', id);
    }

    const { data: member, error: memberErr } = await query.maybeSingle();

    if (memberErr || !member) {
      return null;
    }

    // Fetch notes for this real member
    const { data: notes } = await supabase
      .from('notes')
      .select('*')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false });

    // Fetch follow-ups for this real member
    const { data: followUps } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('member_id', member.id)
      .order('scheduled_date', { ascending: false });

    // Fetch default business settings for WhatsApp messaging
    const { data: settings } = await supabase
      .from('settings')
      .select('business_name, default_whatsapp_template')
      .limit(1)
      .maybeSingle();

    return {
      member: hydrateMemberV2(member as Record<string, unknown>),
      notes: (notes || []) as Note[],
      followUps: (followUps || []) as FollowUpTask[],
      businessName: settings?.business_name || 'Achintya Matrimony',
      defaultWhatsAppTemplate: settings?.default_whatsapp_template || '',
    };
  } else {
    // Dev fallback when Supabase is not configured
    const raw = devSampleMembers.find((m) => m.id === id || m.reg_id === id);
    if (!raw) return null;
    return {
      member: hydrateMemberV2(raw as unknown as Record<string, unknown>),
      notes: devSampleNotes.filter((n) => n.member_id === raw.id),
      followUps: devSampleFollowUps.filter((t) => t.member_id === raw.id),
      businessName: 'Achintya Matrimony',
      defaultWhatsAppTemplate: '',
    };
  }
}

async function MemberProfileContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMemberData(id);

  if (!data || !data.member) {
    return (
      <EmptyState
        icon="🔍"
        title="Member Record Not Found"
        description={`Could not find a member record matching ID "${id}". Please check the registration ID or directory.`}
        action={
          <Link href="/admin/members" className="btn btn-primary btn-sm">
            ← Return to Member Directory
          </Link>
        }
      />
    );
  }

  return (
    <MemberDetailView
      initialMember={data.member}
      initialNotes={data.notes}
      initialFollowUps={data.followUps}
      businessName={data.businessName}
      defaultWhatsAppTemplate={data.defaultWhatsAppTemplate}
    />
  );
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <AdminTopBar
        title="Member Profile"
        subtitle="Detailed matrimonial profile, contact records, notes, and scheduled follow-ups"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading member profile..." />}>
          <MemberProfileContent params={params} />
        </Suspense>
      </div>
    </>
  );
}
