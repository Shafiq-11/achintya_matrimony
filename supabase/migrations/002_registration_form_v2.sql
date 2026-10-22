-- ==============================================================================
-- ACHINTYA MATRIMONY CRM - DATABASE MIGRATION
-- Migration: 002_registration_form_v2.sql
-- Description: Adds new registration form fields (Section A to D), preserves all
-- existing records and IDs, and adds search indexes without destructive changes.
-- ==============================================================================

-- Section A: Personal Details
ALTER TABLE members ADD COLUMN IF NOT EXISTS siblings TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS kulam TEXT;

-- Section B: Education and Family
ALTER TABLE members ADD COLUMN IF NOT EXISTS college_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS college_degree TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS education_other TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS parents_details TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS parents_origin TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS place_of_living TEXT;

-- Section C: Work and Financial Details
ALTER TABLE members ADD COLUMN IF NOT EXISTS business_details TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS property_details TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS monthly_income NUMERIC CHECK (monthly_income IS NULL OR monthly_income >= 0);
ALTER TABLE members ADD COLUMN IF NOT EXISTS passive_income NUMERIC CHECK (passive_income IS NULL OR passive_income >= 0);
ALTER TABLE members ADD COLUMN IF NOT EXISTS passive_income_type TEXT CHECK (passive_income_type IS NULL OR passive_income_type IN ('monthly', 'annual'));
ALTER TABLE members ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS employer_name TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS salary_info TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Section D: Health Information (Confidential Sensitive Data)
ALTER TABLE members ADD COLUMN IF NOT EXISTS health_info TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS health_consent_given BOOLEAN DEFAULT false;

-- Indexes for efficient lookup & CRM performance
CREATE INDEX IF NOT EXISTS idx_members_kulam ON members(kulam);
CREATE INDEX IF NOT EXISTS idx_members_place_of_living ON members(place_of_living);
CREATE INDEX IF NOT EXISTS idx_members_employment_status ON members(employment_status);
