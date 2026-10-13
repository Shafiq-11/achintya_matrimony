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

// Public Registration Form Submission Payload
export interface PublicRegistrationPayload {
  full_name: string;
  gender: Gender;
  dob: string;
  phone: string;
  email?: string;
  location_city: string;
  location_state: string;
  marital_status: MaritalStatus;
  religion?: string;
  caste?: string;
  mother_tongue?: string;
  height_cm?: number;
  education: string;
  occupation?: string;
  annual_income?: string;
  about_me?: string;
  partner_preferences?: string;
  consent_given: boolean;
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
