import type { Member } from '@/lib/types';

export const STRUCTURED_TAG_PREFIX = '<!--ACHINTYA_STRUCTURED_V2:';
export const STRUCTURED_TAG_SUFFIX = ':END_ACHINTYA_STRUCTURED_V2-->';

export interface StructuredV2Data {
  siblings?: string | null;
  kulam?: string | null;
  college_name?: string | null;
  college_degree?: string | null;
  school_name?: string | null;
  education_other?: string | null;
  parents_details?: string | null;
  parents_origin?: string | null;
  place_of_living?: string | null;
  business_details?: string | null;
  property_details?: string | null;
  monthly_income?: number | string | null;
  passive_income?: number | string | null;
  passive_income_type?: 'monthly' | 'annual' | string | null;
  employment_status?: string | null;
  employer_name?: string | null;
  job_title?: string | null;
  salary_info?: string | null;
  linkedin_url?: string | null;
  health_info?: string | null;
  health_consent_given?: boolean | null;
}

/**
 * Packs structured V2 fields into a secure JSON comment inside about_me as a zero-loss fallback
 * in case database columns have not yet been migrated in Supabase.
 */
export function packStructuredDataIntoAboutMe(userAboutMe: string | null | undefined, v2: StructuredV2Data): string {
  const jsonStr = JSON.stringify(v2);
  const cleanAbout = (userAboutMe || '').replace(
    new RegExp(`${STRUCTURED_TAG_PREFIX}[\\s\\S]*?${STRUCTURED_TAG_SUFFIX}`, 'g'),
    ''
  ).trim();

  const commentBlock = `${STRUCTURED_TAG_PREFIX}${Buffer.from(jsonStr).toString('base64')}${STRUCTURED_TAG_SUFFIX}`;
  return cleanAbout ? `${cleanAbout}\n\n${commentBlock}` : commentBlock;
}

/**
 * Parses and extracts structured V2 fields from raw Member record, supporting both native
 * table columns and fallback packed data.
 */
export function hydrateMemberV2(raw: Record<string, unknown>): Member {
  let structured: StructuredV2Data = {};

  // Check if about_me contains encoded fallback
  if (typeof raw.about_me === 'string' && raw.about_me.includes(STRUCTURED_TAG_PREFIX)) {
    try {
      const match = raw.about_me.match(
        new RegExp(`${STRUCTURED_TAG_PREFIX}([A-Za-z0-9+/=]+)${STRUCTURED_TAG_SUFFIX}`)
      );
      if (match && match[1]) {
        const decoded = Buffer.from(match[1], 'base64').toString('utf8');
        structured = JSON.parse(decoded);
      }
    } catch {
      // Ignore parse failure gracefully
    }
  }

  // Clean about_me so user doesn't see internal tag
  const cleanedAboutMe = typeof raw.about_me === 'string'
    ? raw.about_me.replace(
        new RegExp(`\\n*${STRUCTURED_TAG_PREFIX}[\\s\\S]*?${STRUCTURED_TAG_SUFFIX}`, 'g'),
        ''
      ).trim() || null
    : null;

  return {
    id: String(raw.id || ''),
    reg_id: String(raw.reg_id || ''),
    full_name: String(raw.full_name || ''),
    gender: (raw.gender as Member['gender']) || 'Female',
    dob: String(raw.dob || ''),
    phone: String(raw.phone || ''),
    email: raw.email ? String(raw.email) : null,
    location_city: String(raw.location_city || structured.place_of_living || ''),
    location_state: String(raw.location_state || ''),
    marital_status: (raw.marital_status as Member['marital_status']) || 'Never Married',
    religion: raw.religion ? String(raw.religion) : null,
    caste: raw.caste ? String(raw.caste) : null,
    mother_tongue: raw.mother_tongue ? String(raw.mother_tongue) : null,
    height_cm: raw.height_cm ? Number(raw.height_cm) : null,
    education: String(raw.education || structured.college_degree || 'Not specified'),
    occupation: raw.occupation ? String(raw.occupation) : (structured.job_title || structured.employment_status || null),
    annual_income: raw.annual_income ? String(raw.annual_income) : null,
    about_me: cleanedAboutMe,
    partner_preferences: raw.partner_preferences ? String(raw.partner_preferences) : null,
    consent_given: Boolean(raw.consent_given),
    profile_status: (raw.profile_status as Member['profile_status']) || 'new',
    registration_source: (raw.registration_source as Member['registration_source']) || 'website',
    created_at: String(raw.created_at || ''),
    updated_at: String(raw.updated_at || ''),

    // Section A
    siblings: (raw.siblings as string) ?? structured.siblings ?? null,
    kulam: (raw.kulam as string) ?? structured.kulam ?? null,

    // Section B
    college_name: (raw.college_name as string) ?? structured.college_name ?? null,
    college_degree: (raw.college_degree as string) ?? structured.college_degree ?? null,
    school_name: (raw.school_name as string) ?? structured.school_name ?? null,
    education_other: (raw.education_other as string) ?? structured.education_other ?? null,
    parents_details: (raw.parents_details as string) ?? structured.parents_details ?? null,
    parents_origin: (raw.parents_origin as string) ?? structured.parents_origin ?? null,
    place_of_living: (raw.place_of_living as string) ?? structured.place_of_living ?? (raw.location_city as string) ?? null,

    // Section C
    business_details: (raw.business_details as string) ?? structured.business_details ?? null,
    property_details: (raw.property_details as string) ?? structured.property_details ?? null,
    monthly_income: (raw.monthly_income as number | string) ?? structured.monthly_income ?? null,
    passive_income: (raw.passive_income as number | string) ?? structured.passive_income ?? null,
    passive_income_type: (raw.passive_income_type as 'monthly' | 'annual') ?? structured.passive_income_type ?? null,
    employment_status: (raw.employment_status as string) ?? structured.employment_status ?? null,
    employer_name: (raw.employer_name as string) ?? structured.employer_name ?? null,
    job_title: (raw.job_title as string) ?? structured.job_title ?? null,
    salary_info: (raw.salary_info as string) ?? structured.salary_info ?? null,
    linkedin_url: (raw.linkedin_url as string) ?? structured.linkedin_url ?? null,

    // Section D (Sensitive Health)
    health_info: (raw.health_info as string) ?? structured.health_info ?? null,
    health_consent_given: (raw.health_consent_given as boolean) ?? structured.health_consent_given ?? false,
  };
}
