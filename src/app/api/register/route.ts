import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PublicRegistrationPayload, Gender, MaritalStatus } from '@/lib/types';

// Helper: Calculate age from DOB
function getAge(dobString: string): number {
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Helper: Validate Indian phone number (10 digits, optionally prefixed with +91 or 0)
function validateIndianPhone(phone: string): { isValid: boolean; normalized: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return { isValid: true, normalized: `+91${digits}` };
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return { isValid: true, normalized: `+${digits}` };
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return { isValid: true, normalized: `+91${digits.slice(1)}` };
  }
  return { isValid: false, normalized: phone };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Honeypot check for spam bots
    if (body.website_trap && body.website_trap.trim() !== '') {
      return NextResponse.json(
        { error: 'Invalid submission detected.' },
        { status: 400 }
      );
    }

    const {
      full_name,
      gender,
      dob,
      phone,
      email,
      location_city,
      location_state,
      marital_status,
      religion,
      caste,
      mother_tongue,
      height_cm,
      education,
      occupation,
      annual_income,
      about_me,
      partner_preferences,
      consent_given,
    } = body as PublicRegistrationPayload & { website_trap?: string };

    // 2. Server-side Validation of Required Fields
    const errors: Record<string, string> = {};

    if (!full_name || full_name.trim().length < 2) {
      errors.full_name = 'Please provide a valid full name (minimum 2 characters).';
    }

    const validGenders: Gender[] = ['Male', 'Female', 'Other'];
    if (!gender || !validGenders.includes(gender)) {
      errors.gender = 'Please select a valid gender.';
    }

    if (!dob) {
      errors.dob = 'Date of birth is required.';
    } else {
      const age = getAge(dob);
      if (age < 18) {
        errors.dob = 'Applicant must be at least 18 years old.';
      } else if (age > 90) {
        errors.dob = 'Please enter a valid date of birth.';
      }
    }

    const phoneValidation = validateIndianPhone(phone || '');
    if (!phoneValidation.isValid) {
      errors.phone = 'Please provide a valid 10-digit mobile number.';
    }

    if (!location_city || location_city.trim().length === 0) {
      errors.location_city = 'City / Location is required.';
    }

    if (!location_state || location_state.trim().length === 0) {
      errors.location_state = 'State is required.';
    }

    const validMaritalStatuses: MaritalStatus[] = [
      'Never Married',
      'Divorced',
      'Widowed',
      'Awaiting Divorce',
      'Annulled',
    ];
    if (!marital_status || !validMaritalStatuses.includes(marital_status)) {
      errors.marital_status = 'Please select your marital status.';
    }

    if (!education || education.trim().length === 0) {
      errors.education = 'Education qualification is required.';
    }

    if (!consent_given) {
      errors.consent_given = 'Consent is required to proceed with registration.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed. Please correct the highlighted errors.', details: errors },
        { status: 422 }
      );
    }

    // 3. Database Operation via Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your-project-ref');

    let generatedRegId = `AM-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isSupabaseConfigured) {
      const supabase = await createClient();

      // Check for recent duplicate submission with identical phone number
      const { data: existing } = await supabase
        .from('members')
        .select('id, reg_id, created_at')
        .eq('phone', phoneValidation.normalized)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Return existing registration ID safely to prevent accidental duplicates
        return NextResponse.json({
          success: true,
          regId: existing.reg_id,
          message: 'An existing profile with this mobile number was found. Your information has been referenced.',
          isExisting: true,
        });
      }

      // Insert new member record
      const { data: inserted, error: insertError } = await supabase
        .from('members')
        .insert({
          full_name: full_name.trim(),
          gender,
          dob,
          phone: phoneValidation.normalized,
          email: email?.trim() || null,
          location_city: location_city.trim(),
          location_state: location_state.trim(),
          marital_status,
          religion: religion?.trim() || null,
          caste: caste?.trim() || null,
          mother_tongue: mother_tongue?.trim() || null,
          height_cm: height_cm ? Number(height_cm) : null,
          education: education.trim(),
          occupation: occupation?.trim() || null,
          annual_income: annual_income?.trim() || null,
          about_me: about_me?.trim() || null,
          partner_preferences: partner_preferences?.trim() || null,
          consent_given: true,
          profile_status: 'new',
          registration_source: 'website',
        })
        .select('reg_id')
        .single();

      if (insertError) {
        console.error('Supabase registration insert error:', insertError);
        return NextResponse.json(
          { error: 'Unable to save registration at this time. Please try again or call our office.' },
          { status: 500 }
        );
      }

      if (inserted?.reg_id) {
        generatedRegId = inserted.reg_id;
      }
    } else {
      // Development mode fallback when Supabase is not yet configured
      console.info(
        `[Dev Registration Mode] Received registration for "${full_name}" (${phoneValidation.normalized}). Assigned Demo ID: ${generatedRegId}`
      );
    }

    return NextResponse.json({
      success: true,
      regId: generatedRegId,
      fullName: full_name.trim(),
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
