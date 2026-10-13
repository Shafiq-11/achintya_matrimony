import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { MemberDetailView } from '@/components/members/MemberDetailView';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { devSampleMembers } from '@/lib/data/devSamples';
import type { Member } from '@/lib/types';

export const metadata = {
  title: 'Member Profile Details | Achintya Matrimony CRM',
  description: 'View and manage matrimony member profile.',
};

async function getMemberData(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/members/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    // Fallback lookup from dev samples
    const member = devSampleMembers.find((m) => m.id === id || m.reg_id === id);
    if (!member) return null;
    return {
      member: member as Member,
      notes: [],
      followUps: [],
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
        description={`Could not find a member record matching ID "${id}". It may have been archived or deleted.`}
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
      initialNotes={data.notes || []}
      initialFollowUps={data.followUps || []}
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
        subtitle="Detailed matrimonial profile, contact records, and preferences"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading member profile..." />}>
          <MemberProfileContent params={params} />
        </Suspense>
      </div>
    </>
  );
}
