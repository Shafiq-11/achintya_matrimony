import type { Member, Note, FollowUpTask } from '@/lib/types';

// Mock initial members used strictly in local development before Supabase project is connected
const initialMembers: Member[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    reg_id: 'AM-1001',
    full_name: 'Aditi Sharma',
    gender: 'Female',
    dob: '1997-04-12',
    phone: '+919822011223',
    email: 'aditi.sharma@example.com',
    location_city: 'Pune',
    location_state: 'Maharashtra',
    marital_status: 'Never Married',
    religion: 'Hindu',
    caste: 'Brahmin',
    mother_tongue: 'Marathi',
    height_cm: 165,
    education: 'MBA Marketing',
    occupation: 'Senior Product Specialist',
    annual_income: '16 LPA',
    about_me: 'Family oriented, modern outlook with traditional core values. Enjoys travel and reading.',
    partner_preferences: 'Educated professional, vegetarian preferred, mutual respect.',
    consent_given: true,
    profile_status: 'new',
    registration_source: 'website',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c9b1b220-3b4e-4b71-923b-12d4a6e8b012',
    reg_id: 'AM-1002',
    full_name: 'Rahul K. Verma',
    gender: 'Male',
    dob: '1994-08-22',
    phone: '+919890123456',
    email: 'rahul.verma@example.com',
    location_city: 'Mumbai',
    location_state: 'Maharashtra',
    marital_status: 'Never Married',
    religion: 'Hindu',
    caste: 'Kayastha',
    mother_tongue: 'Hindi',
    height_cm: 178,
    education: 'B.Tech Computer Science',
    occupation: 'Software Development Lead',
    annual_income: '28 LPA',
    about_me: 'Tech enthusiast, sports lover, supportive and close-knit family background.',
    partner_preferences: 'Working professional, culturally aligned, cheerful nature.',
    consent_given: true,
    profile_status: 'active',
    registration_source: 'website',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8a9c3d4e-5f60-7a8b-9c0d-1e2f3a4b5c6d',
    reg_id: 'AM-1003',
    full_name: 'Sneha Patil',
    gender: 'Female',
    dob: '1996-11-05',
    phone: '+919811223344',
    email: 'sneha.patil@example.com',
    location_city: 'Bangalore',
    location_state: 'Karnataka',
    marital_status: 'Never Married',
    religion: 'Hindu',
    caste: 'Maratha',
    mother_tongue: 'Marathi',
    height_cm: 160,
    education: 'M.Sc Data Science',
    occupation: 'Data Scientist',
    annual_income: '22 LPA',
    about_me: 'Ambitious yet grounded, enjoys trekking and photography.',
    partner_preferences: 'Broad-minded, ambitious, family-oriented partner.',
    consent_given: true,
    profile_status: 'contacted',
    registration_source: 'referral',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock in-memory notes store for development
const initialNotes: Note[] = [
  {
    id: 'note-101',
    member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    content: 'Spoke with candidate and father. Looking for grooms based in Pune or Mumbai. Vegetarian preference.',
    author_email: 'admin@achintyamatrimony.com',
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'note-102',
    member_id: 'c9b1b220-3b4e-4b71-923b-12d4a6e8b012',
    content: 'Introductory call completed. Candidate is open to relocate if matching opportunity exists.',
    author_email: 'admin@achintyamatrimony.com',
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock in-memory follow-up callbacks store for development
const initialFollowUps: FollowUpTask[] = [
  {
    id: 'task-101',
    member_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    scheduled_date: new Date().toISOString().split('T')[0], // Due Today
    scheduled_time: '15:30:00',
    reason: 'Follow-up regarding shortlist proposals sent via WhatsApp.',
    status: 'pending',
    author_email: 'admin@achintyamatrimony.com',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-102',
    member_id: 'c9b1b220-3b4e-4b71-923b-12d4a6e8b012',
    scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Upcoming tomorrow
    scheduled_time: '11:00:00',
    reason: 'Call to review feedback on candidate profiles shared yesterday.',
    status: 'pending',
    author_email: 'admin@achintyamatrimony.com',
    created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-103',
    member_id: '8a9c3d4e-5f60-7a8b-9c0d-1e2f3a4b5c6d',
    scheduled_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0], // Upcoming in 2 days
    scheduled_time: '17:00:00',
    reason: 'Schedule discussion with family elders regarding horoscope compatibility.',
    status: 'pending',
    author_email: 'admin@achintyamatrimony.com',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Attach to globalThis so all Next.js route chunks share the single authoritative state in dev
const globalDevStore = globalThis as unknown as {
  __devSampleMembers?: Member[];
  __devSampleNotes?: Note[];
  __devSampleFollowUps?: FollowUpTask[];
};

if (!globalDevStore.__devSampleMembers) {
  globalDevStore.__devSampleMembers = [...initialMembers];
}
if (!globalDevStore.__devSampleNotes) {
  globalDevStore.__devSampleNotes = [...initialNotes];
}
if (!globalDevStore.__devSampleFollowUps) {
  globalDevStore.__devSampleFollowUps = [...initialFollowUps];
}

export const devSampleMembers = globalDevStore.__devSampleMembers;
export const devSampleNotes = globalDevStore.__devSampleNotes;
export const devSampleFollowUps = globalDevStore.__devSampleFollowUps;
