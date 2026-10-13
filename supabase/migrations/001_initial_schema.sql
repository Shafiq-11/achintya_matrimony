-- ==============================================================================
-- ACHINTYA MATRIMONY CRM - DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Sets up initial tables, constraints, indexes, triggers, and RLS.
-- ==============================================================================

-- 1. Helper Function: Automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Registration ID Sequence Generator (e.g., AM-1001, AM-1002...)
CREATE SEQUENCE IF NOT EXISTS member_reg_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_reg_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reg_id IS NULL OR NEW.reg_id = '' THEN
        NEW.reg_id = 'AM-' || nextval('member_reg_seq')::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. Table: members
-- ==============================================================================
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location_city TEXT NOT NULL,
    location_state TEXT NOT NULL,
    marital_status TEXT NOT NULL CHECK (marital_status IN ('Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce', 'Annulled')),
    religion TEXT,
    caste TEXT,
    mother_tongue TEXT,
    height_cm INTEGER CHECK (height_cm IS NULL OR (height_cm >= 90 AND height_cm <= 250)),
    education TEXT NOT NULL,
    occupation TEXT,
    annual_income TEXT,
    about_me TEXT,
    partner_preferences TEXT,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    profile_status TEXT NOT NULL DEFAULT 'new' CHECK (profile_status IN ('new', 'active', 'contacted', 'shortlisted', 'matched', 'inactive', 'archived')),
    registration_source TEXT NOT NULL DEFAULT 'website' CHECK (registration_source IN ('website', 'zoho_migration', 'manual_admin', 'referral')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Triggers for members
DROP TRIGGER IF EXISTS trigger_set_reg_id ON members;
CREATE TRIGGER trigger_set_reg_id
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION generate_reg_id();

DROP TRIGGER IF EXISTS trigger_members_updated_at ON members;
CREATE TRIGGER trigger_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for members
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_reg_id ON members(reg_id);
CREATE INDEX IF NOT EXISTS idx_members_gender ON members(gender);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(profile_status);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);

-- ==============================================================================
-- 4. Table: notes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notes_member_id ON notes(member_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- ==============================================================================
-- 5. Table: follow_ups (Daily Tasks & Callbacks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    author_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trigger_follow_ups_updated_at ON follow_ups;
CREATE TRIGGER trigger_follow_ups_updated_at
    BEFORE UPDATE ON follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_follow_ups_member_id ON follow_ups(member_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_schedule ON follow_ups(scheduled_date, status);

-- ==============================================================================
-- 6. Table: settings (Application & Business Settings - Single Row)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Achintya Matrimony',
    business_phone TEXT NOT NULL DEFAULT '+919876543210',
    business_email TEXT DEFAULT 'contact@achintyamatrimony.com',
    default_whatsapp_template TEXT NOT NULL DEFAULT 'Namaste {{name}}, this is {{business_name}}. We received your matrimony registration (ID: {{reg_id}}). When would be a convenient time for a quick introductory call?',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default settings if empty
INSERT INTO settings (business_name, business_phone, business_email, default_whatsapp_template, timezone)
SELECT 'Achintya Matrimony', '+919876543210', 'contact@achintyamatrimony.com',
       'Namaste {{name}}, this is {{business_name}}. We received your matrimony registration (ID: {{reg_id}}). When would be a convenient time for a quick introductory call?',
       'Asia/Kolkata'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- ==============================================================================
-- 7. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 7.1 Members Policies
-- Public can ONLY insert new registrations from the website form
DROP POLICY IF EXISTS "Public registration insert" ON members;
CREATE POLICY "Public registration insert"
    ON members
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (registration_source = 'website');

-- Authenticated Admin has complete access to view and manage members
DROP POLICY IF EXISTS "Admin full access members" ON members;
CREATE POLICY "Admin full access members"
    ON members
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7.2 Notes Policies
-- Only authenticated administrators can access notes
DROP POLICY IF EXISTS "Admin full access notes" ON notes;
CREATE POLICY "Admin full access notes"
    ON notes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7.3 Follow-ups Policies
-- Only authenticated administrators can access follow-up tasks
DROP POLICY IF EXISTS "Admin full access follow_ups" ON follow_ups;
CREATE POLICY "Admin full access follow_ups"
    ON follow_ups
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7.4 Settings Policies
-- Authenticated admin has complete access
DROP POLICY IF EXISTS "Admin full access settings" ON settings;
CREATE POLICY "Admin full access settings"
    ON settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Public can read basic business contact information (for header & Call Now button)
DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings"
    ON settings
    FOR SELECT
    TO anon
    USING (true);
