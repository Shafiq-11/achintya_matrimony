// ==============================================================================
// Achintya Matrimony CRM - Core Data Types & Interfaces
// ==============================================================================

export type Gender = 'Male' | 'Female' | 'Other';

export type MaritalStatus =
  | 'Never Married'
  | 'Divorced'
  | 'Widowed'
  | 'Awaiting Divorce'
  | 'Annulled';

export type ProfileStatus =
  | 'new'
  | 'active'
  | 'contacted'
  | 'shortlisted'
  | 'matched'
  | 'inactive'
  | 'archived';

export type RegistrationSource =
  | 'website'
  | 'zoho_migration'
  | 'manual_admin'
  | 'referral';

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export interface Member {
  id: string;
  reg_id: string;
  full_name: string;
  gender: Gender;
  dob: string; // ISO date 'YYYY-MM-DD'
  phone: string;
  email?: string | null;
  location_city: string;
  location_state: string;
  marital_status: MaritalStatus;
  religion?: string | null;
  caste?: string | null;
  mother_tongue?: string | null;
  height_cm?: number | null;
  education: string;
  occupation?: string | null;
  annual_income?: string | null;
  about_me?: string | null;
  partner_preferences?: string | null;
  consent_given: boolean;
  profile_status: ProfileStatus;
  registration_source: RegistrationSource;
  created_at: string;
  updated_at: string;

  // Section A - Personal Details (V2)
  siblings?: string | null;
  kulam?: string | null;

  // Section B - Education and Family (V2)
  college_name?: string | null;
  college_degree?: string | null;
  school_name?: string | null;
  education_other?: string | null;
  parents_details?: string | null;
  parents_origin?: string | null;
  place_of_living?: string | null;

  // Section C - Work and Financial Details (V2)
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

  // Section D - Health Information (V2 Sensitive)
  health_info?: string | null;
  health_consent_given?: boolean | null;
}

export interface Note {
  id: string;
  member_id: string;
  content: string;
  author_email?: string | null;
  created_at: string;
}

export interface FollowUpTask {
  id: string;
  member_id: string;
  scheduled_date: string; // 'YYYY-MM-DD'
  scheduled_time?: string | null; // 'HH:MM:SS'
  reason: string;
  status: FollowUpStatus;
  completed_at?: string | null;
  author_email?: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined member info for Daily Tasks view
  member?: Pick<Member, 'id' | 'reg_id' | 'full_name' | 'phone' | 'gender'>;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  business_phone: string;
  business_email?: string | null;
  default_whatsapp_template: string;
  timezone: string;
  updated_at: string;
}

// Public Registration Form Submission Payload (V2 Sections A to D)
export interface PublicRegistrationPayload {
  // Section A: Personal Details
  full_name: string;
  gender: Gender;
  dob: string;
  phone: string;
  email?: string;
  marital_status?: MaritalStatus;
  siblings?: string;
  kulam?: string;
  height_cm?: number | string;

  // Section B: Education and Family
  college_name?: string;
  college_degree?: string;
  school_name?: string;
  education_other?: string;
  parents_details?: string;
  parents_origin?: string;
  place_of_living: string;
  location_city?: string;
  location_state?: string;

  // Section C: Work and Financial Details
  employment_status?: string;
  employer_name?: string;
  job_title?: string;
  salary_info?: string;
  business_details?: string;
  property_details?: string;
  monthly_income?: number | string;
  passive_income?: number | string;
  passive_income_type?: 'monthly' | 'annual' | string;
  linkedin_url?: string;

  // Section D: Health Information
  health_info?: string;
  health_consent_given?: boolean;

  // Legacy / Common
  about_me?: string;
  partner_preferences?: string;
  consent_given: boolean;
  website_trap?: string;
}

// Dashboard Summary Metrics
export interface DashboardMetrics {
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
  newRegistrations: number;
  callsDueToday: number;
  callsOverdue: number;
  callsUpcoming: number;
}
