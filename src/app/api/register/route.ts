import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SUPABASE_URL } from '@/lib/supabase/config';
import { packStructuredDataIntoAboutMe } from '@/lib/utils/memberProfile';
import type { PublicRegistrationPayload, Gender } from '@/lib/types';

// Helper: Calculate age from DOB
function getAge(dobString: string): number {
  const parts = dobString.split('-');
  if (parts.length !== 3) return 0;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

// Helper: Validate Indian phone number (10 digits starting with 6-9, optionally prefixed with +91 or 0)
function validateIndianPhone(phone: string): { isValid: boolean; normalized: string } {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { isValid: true, normalized: `+91${digits}` };
  }
  return { isValid: false, normalized: phone };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Honeypot check for spam bots
    if (body.website_trap && String(body.website_trap).trim() !== '') {
      return NextResponse.json(
        { error: 'Invalid submission detected.' },
        { status: 400 }
      );
    }

    const payload = body as PublicRegistrationPayload;

    // 2. Server-side Validation of Required Fields
    const errors: Record<string, string> = {};

    // Section A
    if (!payload.full_name || payload.full_name.trim().length < 2) {
      errors.full_name = 'Please provide a valid full name (minimum 2 characters).';
    }

    const validGenders: Gender[] = ['Male', 'Female', 'Other'];
    if (!payload.gender || !validGenders.includes(payload.gender)) {
      errors.gender = 'Please select a valid gender.';
    }

    if (!payload.dob) {
      errors.dob = 'Date of birth is required.';
    } else {
      const dobDate = new Date(payload.dob);
      const today = new Date();
      if (dobDate > today) {
        errors.dob = 'Date of birth cannot be in the future.';
      } else {
        const age = getAge(payload.dob);
        if (age < 18) {
          errors.dob = 'Applicant must be at least 18 years old.';
        } else if (age > 90) {
          errors.dob = 'Please enter a valid date of birth.';
        }
      }
    }

    const phoneValidation = validateIndianPhone(payload.phone || '');
    if (!phoneValidation.isValid) {
      errors.phone = 'Please provide a valid 10-digit mobile number.';
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (payload.height_cm) {
      const h = Number(payload.height_cm);
      if (isNaN(h) || h < 90 || h > 250) {
        errors.height_cm = 'Height must be between 90 and 250 cm.';
      }
    }

    // Section B
    const placeOfLiving = payload.place_of_living?.trim() || payload.location_city?.trim();
    if (!placeOfLiving) {
      errors.place_of_living = 'Place of living (Town / City) is required.';
    }

    // Section C
    if (payload.monthly_income !== undefined && payload.monthly_income !== null && payload.monthly_income !== '') {
      const inc = Number(payload.monthly_income);
      if (isNaN(inc) || inc < 0) {
        errors.monthly_income = 'Monthly income cannot be negative.';
      }
    }

    if (payload.passive_income !== undefined && payload.passive_income !== null && payload.passive_income !== '') {
      const pass = Number(payload.passive_income);
      if (isNaN(pass) || pass < 0) {
        errors.passive_income = 'Passive income cannot be negative.';
      }
    }

    if (payload.linkedin_url && payload.linkedin_url.trim()) {
      if (!/^https?:\/\/(www\.)?linkedin\.com\/.*$/i.test(payload.linkedin_url.trim())) {
        errors.linkedin_url = 'Please provide a valid LinkedIn URL.';
      }
    }

    // Section D
    if (payload.health_info && payload.health_info.trim() && !payload.health_consent_given) {
      errors.health_consent_given = 'Consent is required to store sensitive health information.';
    }

    // Consent
    if (!payload.consent_given) {
      errors.consent_given = 'Consent is required to proceed with registration.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed. Please correct the highlighted errors.', details: errors },
        { status: 422 }
      );
    }

    // 3. Database Operation via Supabase
    const supabaseUrl = SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    let generatedRegId = `AM-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const supabase = await createClient();

      // Structured V2 Fields
      const v2Data = {
        siblings: payload.siblings?.trim() || null,
        kulam: payload.kulam?.trim() || null,
        college_name: payload.college_name?.trim() || null,
        college_degree: payload.college_degree?.trim() || null,
        school_name: payload.school_name?.trim() || null,
        education_other: payload.education_other?.trim() || null,
        parents_details: payload.parents_details?.trim() || null,
        parents_origin: payload.parents_origin?.trim() || null,
        place_of_living: placeOfLiving || null,
        business_details: payload.business_details?.trim() || null,
        property_details: payload.property_details?.trim() || null,
        monthly_income: payload.monthly_income ? Number(payload.monthly_income) : null,
        passive_income: payload.passive_income ? Number(payload.passive_income) : null,
        passive_income_type: payload.passive_income_type || null,
        employment_status: payload.employment_status || null,
        employer_name: payload.employer_name?.trim() || null,
        job_title: payload.job_title?.trim() || null,
        salary_info: payload.salary_info?.trim() || null,
        linkedin_url: payload.linkedin_url?.trim() || null,
        health_info: payload.health_info?.trim() || null,
        health_consent_given: Boolean(payload.health_consent_given),
      };

      // Summary mappings for backwards-compatible 001 columns
      const compositeEducation = payload.college_degree?.trim()
        ? (payload.college_name?.trim() ? `${payload.college_degree.trim()} (${payload.college_name.trim()})` : payload.college_degree.trim())
        : (payload.school_name?.trim() || 'Education details recorded');

      const compositeOccupation = payload.job_title?.trim()
        ? (payload.employer_name?.trim() ? `${payload.job_title.trim()} at ${payload.employer_name.trim()}` : payload.job_title.trim())
        : (payload.business_details?.trim() ? `Business: ${payload.business_details.trim().slice(0, 40)}` : payload.employment_status || 'Employed');

      const compositeIncome = payload.monthly_income
        ? `₹${Number(payload.monthly_income).toLocaleString('en-IN')} / month`
        : (payload.salary_info?.trim() || null);

      // Full payload mapping to database columns
      const fullNativePayload = {
        full_name: payload.full_name.trim(),
        gender: payload.gender,
        dob: payload.dob,
        phone: phoneValidation.normalized,
        email: payload.email?.trim() || null,
        location_city: placeOfLiving,
        location_state: payload.location_state?.trim() || 'Tamil Nadu',
        marital_status: payload.marital_status || 'Never Married',
        caste: payload.kulam?.trim() || null,
        height_cm: payload.height_cm ? Number(payload.height_cm) : null,
        education: compositeEducation,
        occupation: compositeOccupation,
        annual_income: compositeIncome,
        about_me: payload.about_me?.trim() || null,
        partner_preferences: payload.partner_preferences?.trim() || null,
        consent_given: true,
        profile_status: 'new',
        registration_source: 'website',

        // V2 Native Columns
        ...v2Data,
      };

      // Execute insert operation
      if (adminClient) {
        const { data: inserted, error: insertError } = await adminClient
          .from('members')
          .insert(fullNativePayload)
          .select('reg_id, full_name, id, created_at')
          .single();

        if (insertError) {
          console.error('[API Register Error] Supabase insert failed:', insertError.code, insertError.message);

          // If a schema mismatch occurs, attempt safe fallback with packed about_me
          const fallbackAboutMe = packStructuredDataIntoAboutMe(payload.about_me, v2Data);
          const safeBasePayload = {
            full_name: payload.full_name.trim(),
            gender: payload.gender,
            dob: payload.dob,
            phone: phoneValidation.normalized,
            email: payload.email?.trim() || null,
            location_city: placeOfLiving,
            location_state: payload.location_state?.trim() || 'Tamil Nadu',
            marital_status: payload.marital_status || 'Never Married',
            caste: payload.kulam?.trim() || null,
            height_cm: payload.height_cm ? Number(payload.height_cm) : null,
            education: compositeEducation,
            occupation: compositeOccupation,
            annual_income: compositeIncome,
            about_me: fallbackAboutMe,
            partner_preferences: payload.partner_preferences?.trim() || null,
            consent_given: true,
            profile_status: 'new',
            registration_source: 'website',
          };

          const { data: fallbackInserted, error: fallbackError } = await adminClient
            .from('members')
            .insert(safeBasePayload)
            .select('reg_id')
            .single();

          if (fallbackError) {
            console.error('[API Register Error] Supabase fallback insert failed:', fallbackError.code, fallbackError.message);
            return NextResponse.json(
              { error: 'Unable to save registration at this time. Please try again or call our office.' },
              { status: 500 }
            );
          }

          if (fallbackInserted?.reg_id) {
            generatedRegId = fallbackInserted.reg_id;
          }
        } else if (inserted?.reg_id) {
          generatedRegId = inserted.reg_id;
        }
      } else {
        // Fallback when admin client is not initialized: use standard Supabase client without select (to satisfy RLS)
        const { error: anonInsertError } = await supabase
          .from('members')
          .insert(fullNativePayload);

        if (anonInsertError) {
          console.error('[API Register Error] Anon client insert failed:', anonInsertError.code, anonInsertError.message);
          return NextResponse.json(
            { error: 'Unable to save registration at this time. Please try again or call our office.' },
            { status: 500 }
          );
        }
      }

      // Revalidate admin dashboard and member list cache so newly registered member appears immediately
      try {
        revalidatePath('/admin');
        revalidatePath('/admin/members');
      } catch (cacheErr) {
        console.warn('[API Register] Cache revalidation warning:', cacheErr);
      }
    } else {
      // In-memory development mode fallback when Supabase is not configured
      console.info(
        `[Dev Registration Mode] Received registration for "${payload.full_name}" (${phoneValidation.normalized}). Assigned Demo ID: ${generatedRegId}`
      );
    }

    return NextResponse.json({
      success: true,
      regId: generatedRegId,
      fullName: payload.full_name.trim(),
      phone: phoneValidation.normalized,
    });
  } catch (err: unknown) {
    console.error('API /api/register error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please contact support.' },
      { status: 500 }
    );
  }
}
