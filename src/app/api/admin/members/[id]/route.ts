import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { devSampleMembers, devSampleNotes, devSampleFollowUps } from '@/lib/data/devSamples';
import { hydrateMemberV2, packStructuredDataIntoAboutMe } from '@/lib/utils/memberProfile';
import type { ProfileStatus, Gender, MaritalStatus } from '@/lib/types';

function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

      const { data: rawMember, error: memberErr } = await query.maybeSingle();

      if (memberErr) {
        console.error('Supabase member fetch error:', memberErr);
        return NextResponse.json({ error: 'Failed to retrieve member.' }, { status: 500 });
      }

      if (!rawMember) {
        return NextResponse.json({ error: 'Member record not found.' }, { status: 404 });
      }

      const member = hydrateMemberV2(rawMember);

      // Fetch linked notes (using member.id)
      const { data: notes, error: notesErr } = await supabase
        .from('notes')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      if (notesErr) {
        console.warn('Supabase notes fetch warning:', notesErr);
      }

      // Fetch linked follow-ups (using member.id)
      const { data: followUps, error: followUpsErr } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('member_id', member.id)
        .order('scheduled_date', { ascending: false });

      if (followUpsErr) {
        console.warn('Supabase follow-ups fetch warning:', followUpsErr);
      }

      return NextResponse.json({
        success: true,
        member,
        notes: notes || [],
        followUps: followUps || [],
      });
    } else {
      // Dev mode lookup
      const raw = devSampleMembers.find((m) => m.id === id || m.reg_id === id);
      if (!raw) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }

      const member = hydrateMemberV2(raw as unknown as Record<string, unknown>);
      const memberNotes = devSampleNotes.filter((n) => n.member_id === member.id);
      const memberTasks = devSampleFollowUps.filter((t) => t.member_id === member.id);

      return NextResponse.json({
        success: true,
        member,
        notes: memberNotes,
        followUps: memberTasks,
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
    const body = await request.json();

    // Critical Security & Data Integrity Protections:
    // Never allow external callers to modify primary key UUID, registration ID, or creation timestamp
    const safeUpdates: Record<string, unknown> = { ...body };
    delete safeUpdates.id;
    delete safeUpdates.reg_id;
    delete safeUpdates.created_at;

    // Field Validations if being updated
    if (safeUpdates.full_name !== undefined) {
      const name = String(safeUpdates.full_name).trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: 'Full name must contain at least 2 characters.' },
          { status: 422 }
        );
      }
      safeUpdates.full_name = name;
    }

    if (safeUpdates.gender !== undefined) {
      const validGenders: Gender[] = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(safeUpdates.gender as Gender)) {
        return NextResponse.json(
          { error: 'Please specify a valid gender.' },
          { status: 422 }
        );
      }
    }

    if (safeUpdates.profile_status !== undefined) {
      const validStatuses: ProfileStatus[] = [
        'new',
        'active',
        'contacted',
        'shortlisted',
        'matched',
        'inactive',
        'archived',
      ];
      if (!validStatuses.includes(safeUpdates.profile_status as ProfileStatus)) {
        return NextResponse.json(
          { error: 'Invalid profile status specified.' },
          { status: 422 }
        );
      }
    }

    if (safeUpdates.marital_status !== undefined) {
      const validMarital: MaritalStatus[] = [
        'Never Married',
        'Divorced',
        'Widowed',
        'Awaiting Divorce',
        'Annulled',
      ];
      if (!validMarital.includes(safeUpdates.marital_status as MaritalStatus)) {
        return NextResponse.json(
          { error: 'Invalid marital status specified.' },
          { status: 422 }
        );
      }
    }

    if (safeUpdates.phone !== undefined) {
      const phoneDigits = String(safeUpdates.phone).replace(/\D/g, '');
      if (phoneDigits.length === 10) {
        safeUpdates.phone = `+91${phoneDigits}`;
      } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
        safeUpdates.phone = `+${phoneDigits}`;
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) {
        safeUpdates.phone = `+91${phoneDigits.slice(1)}`;
      } else {
        return NextResponse.json(
          { error: 'Please provide a valid 10-digit mobile number.' },
          { status: 422 }
        );
      }
    }

    if (safeUpdates.height_cm !== undefined && safeUpdates.height_cm !== null && safeUpdates.height_cm !== '') {
      const height = Number(safeUpdates.height_cm);
      if (isNaN(height) || height < 90 || height > 250) {
        return NextResponse.json(
          { error: 'Height must be between 90 cm and 250 cm.' },
          { status: 422 }
        );
      }
      safeUpdates.height_cm = height;
    } else if (safeUpdates.height_cm === '') {
      safeUpdates.height_cm = null;
    }

    // Always update last-modified timestamp
    safeUpdates.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const supabase = adminClient || (await createClient());

      // Resolve member record first
      const isUuid = isUuidString(id);
      let lookupQuery = supabase.from('members').select('*');
      if (isUuid) {
        lookupQuery = lookupQuery.eq('id', id);
      } else {
        lookupQuery = lookupQuery.eq('reg_id', id);
      }

      const { data: existingMember, error: lookupErr } = await lookupQuery.maybeSingle();

      if (lookupErr || !existingMember) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }

      // First attempt update with native fields
      const { data: updated, error: updateErr } = await supabase
        .from('members')
        .update(safeUpdates)
        .eq('id', existingMember.id)
        .select('*')
        .single();

      if (!updateErr && updated) {
        try {
          revalidatePath('/admin');
          revalidatePath('/admin/members');
          revalidatePath(`/admin/members/${existingMember.id}`);
        } catch {}
        return NextResponse.json({ success: true, member: hydrateMemberV2(updated) });
      }

      // If native columns error occurred, separate base vs V2 structured fields
      console.warn('Native update fallback triggered in PATCH:', updateErr?.message);

      const existingHydrated = hydrateMemberV2(existingMember);
      const updatedV2Fields = {
        siblings: safeUpdates.siblings !== undefined ? (safeUpdates.siblings as string) : existingHydrated.siblings,
        kulam: safeUpdates.kulam !== undefined ? (safeUpdates.kulam as string) : existingHydrated.kulam,
        college_name: safeUpdates.college_name !== undefined ? (safeUpdates.college_name as string) : existingHydrated.college_name,
        college_degree: safeUpdates.college_degree !== undefined ? (safeUpdates.college_degree as string) : existingHydrated.college_degree,
        school_name: safeUpdates.school_name !== undefined ? (safeUpdates.school_name as string) : existingHydrated.school_name,
        education_other: safeUpdates.education_other !== undefined ? (safeUpdates.education_other as string) : existingHydrated.education_other,
        parents_details: safeUpdates.parents_details !== undefined ? (safeUpdates.parents_details as string) : existingHydrated.parents_details,
        parents_origin: safeUpdates.parents_origin !== undefined ? (safeUpdates.parents_origin as string) : existingHydrated.parents_origin,
        place_of_living: safeUpdates.place_of_living !== undefined ? (safeUpdates.place_of_living as string) : existingHydrated.place_of_living,
        business_details: safeUpdates.business_details !== undefined ? (safeUpdates.business_details as string) : existingHydrated.business_details,
        property_details: safeUpdates.property_details !== undefined ? (safeUpdates.property_details as string) : existingHydrated.property_details,
        monthly_income: safeUpdates.monthly_income !== undefined ? (safeUpdates.monthly_income as number | string) : existingHydrated.monthly_income,
        passive_income: safeUpdates.passive_income !== undefined ? (safeUpdates.passive_income as number | string) : existingHydrated.passive_income,
        passive_income_type: safeUpdates.passive_income_type !== undefined ? (safeUpdates.passive_income_type as 'monthly' | 'annual') : existingHydrated.passive_income_type,
        employment_status: safeUpdates.employment_status !== undefined ? (safeUpdates.employment_status as string) : existingHydrated.employment_status,
        employer_name: safeUpdates.employer_name !== undefined ? (safeUpdates.employer_name as string) : existingHydrated.employer_name,
        job_title: safeUpdates.job_title !== undefined ? (safeUpdates.job_title as string) : existingHydrated.job_title,
        salary_info: safeUpdates.salary_info !== undefined ? (safeUpdates.salary_info as string) : existingHydrated.salary_info,
        linkedin_url: safeUpdates.linkedin_url !== undefined ? (safeUpdates.linkedin_url as string) : existingHydrated.linkedin_url,
        health_info: safeUpdates.health_info !== undefined ? (safeUpdates.health_info as string) : existingHydrated.health_info,
        health_consent_given: safeUpdates.health_consent_given !== undefined ? Boolean(safeUpdates.health_consent_given) : existingHydrated.health_consent_given,
      };

      const userAboutMe = safeUpdates.about_me !== undefined ? String(safeUpdates.about_me) : existingHydrated.about_me;
      const packedAboutMe = packStructuredDataIntoAboutMe(userAboutMe, updatedV2Fields);

      // Safe fallback base updates
      const safeBaseUpdates: Record<string, unknown> = {
        updated_at: safeUpdates.updated_at,
        about_me: packedAboutMe,
      };

      if (safeUpdates.full_name !== undefined) safeBaseUpdates.full_name = safeUpdates.full_name;
      if (safeUpdates.gender !== undefined) safeBaseUpdates.gender = safeUpdates.gender;
      if (safeUpdates.dob !== undefined) safeBaseUpdates.dob = safeUpdates.dob;
      if (safeUpdates.phone !== undefined) safeBaseUpdates.phone = safeUpdates.phone;
      if (safeUpdates.email !== undefined) safeBaseUpdates.email = safeUpdates.email;
      if (safeUpdates.marital_status !== undefined) safeBaseUpdates.marital_status = safeUpdates.marital_status;
      if (safeUpdates.height_cm !== undefined) safeBaseUpdates.height_cm = safeUpdates.height_cm;
      if (safeUpdates.profile_status !== undefined) safeBaseUpdates.profile_status = safeUpdates.profile_status;
      if (safeUpdates.place_of_living !== undefined) safeBaseUpdates.location_city = safeUpdates.place_of_living;
      if (safeUpdates.location_state !== undefined) safeBaseUpdates.location_state = safeUpdates.location_state;
      if (safeUpdates.kulam !== undefined) safeBaseUpdates.caste = safeUpdates.kulam;
      if (safeUpdates.college_degree !== undefined) safeBaseUpdates.education = safeUpdates.college_degree;
      if (safeUpdates.job_title !== undefined) safeBaseUpdates.occupation = safeUpdates.job_title;

      const { data: fallbackUpdated, error: fallbackErr } = await supabase
        .from('members')
        .update(safeBaseUpdates)
        .eq('id', existingMember.id)
        .select('*')
        .single();

      if (fallbackErr) {
        console.error('Fallback Supabase update error:', fallbackErr);
        return NextResponse.json(
          { error: 'Failed to update member in database.' },
          { status: 500 }
        );
      }

      try {
        revalidatePath('/admin');
        revalidatePath('/admin/members');
        revalidatePath(`/admin/members/${existingMember.id}`);
      } catch {}
      return NextResponse.json({ success: true, member: hydrateMemberV2(fallbackUpdated) });
    } else {
      // Dev mode update in memory
      const index = devSampleMembers.findIndex((m) => m.id === id || m.reg_id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }

      devSampleMembers[index] = {
        ...devSampleMembers[index],
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        member: hydrateMemberV2(devSampleMembers[index] as unknown as Record<string, unknown>),
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
