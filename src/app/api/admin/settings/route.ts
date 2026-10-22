import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/config';
import type { BusinessSettings } from '@/lib/types';

const DEFAULT_SETTINGS: BusinessSettings = {
  id: 'default-settings',
  business_name: 'Achintya Matrimony',
  business_phone: '+919876543210',
  business_email: 'contact@achintyamatrimony.com',
  default_whatsapp_template:
    'Namaste {{name}}, this is {{business_name}}. We received your matrimony registration (ID: {{reg_id}}). When would be a convenient time for a quick introductory call?',
  timezone: 'Asia/Kolkata',
  updated_at: new Date().toISOString(),
};

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

export async function GET() {
  try {

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
        meta: {
          isLive: false,
          totalMembers: 0,
          databaseStatus: 'In-Memory / Development Fallback',
        },
      });
    }

    const adminClient = createAdminClient();
    const supabase = adminClient || (await createClient());

    // 1. Fetch current settings record from Supabase
    const { data: dbSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings from database:', settingsError);
      return NextResponse.json(
        { error: 'Failed to retrieve application settings from database.' },
        { status: 500 }
      );
    }

    // 2. Fetch total members count for system overview
    const { count: memberCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    // 3. Resolve active administrator email
    const { data: authData } = await supabase.auth.getUser();
    const adminEmail = authData?.user?.email || process.env.DEV_ADMIN_EMAIL || 'admin@achintyamatrimony.test';

    const activeSettings: BusinessSettings = dbSettings
      ? {
          id: dbSettings.id,
          business_name: dbSettings.business_name || DEFAULT_SETTINGS.business_name,
          business_phone: dbSettings.business_phone || DEFAULT_SETTINGS.business_phone,
          business_email: dbSettings.business_email || DEFAULT_SETTINGS.business_email,
          default_whatsapp_template:
            dbSettings.default_whatsapp_template || DEFAULT_SETTINGS.default_whatsapp_template,
          timezone: dbSettings.timezone || DEFAULT_SETTINGS.timezone,
          updated_at: dbSettings.updated_at || new Date().toISOString(),
        }
      : DEFAULT_SETTINGS;

    return NextResponse.json({
      success: true,
      settings: activeSettings,
      meta: {
        isLive: true,
        totalMembers: memberCount ?? 0,
        adminEmail,
        databaseStatus: 'Supabase PostgreSQL (Connected)',
        supabaseUrl: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : 'Connected',
      },
    });
  } catch (err: unknown) {
    console.error('API /api/admin/settings GET error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching settings.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const errors: Record<string, string> = {};

    // 1. Validate Business Name
    const businessName = String(body.business_name || '').trim();
    if (!businessName || businessName.length < 2) {
      errors.business_name = 'Business name must be at least 2 characters.';
    } else if (businessName.length > 80) {
      errors.business_name = 'Business name cannot exceed 80 characters.';
    }

    // 2. Validate Business Phone
    const rawPhone = String(body.business_phone || '').trim();
    const phoneValidation = validateIndianPhone(rawPhone);
    if (!phoneValidation.isValid) {
      errors.business_phone = 'Please provide a valid 10-digit mobile or telephone number.';
    }

    // 3. Validate Business Email (if provided)
    const businessEmail = body.business_email ? String(body.business_email).trim() : null;
    if (businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      errors.business_email = 'Please provide a valid email address.';
    }

    // 4. Validate WhatsApp Template
    const template = String(body.default_whatsapp_template || '').trim();
    if (!template || template.length < 10) {
      errors.default_whatsapp_template = 'WhatsApp message template must be at least 10 characters.';
    } else if (template.length > 800) {
      errors.default_whatsapp_template = 'WhatsApp message template cannot exceed 800 characters.';
    }

    // 5. Validate Timezone
    const timezone = String(body.timezone || 'Asia/Kolkata').trim();
    const validTimezones = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Kolkata', 'UTC', 'Europe/London', 'America/New_York'];
    if (!validTimezones.includes(timezone)) {
      errors.timezone = 'Please select a valid supported timezone.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Please correct the highlighted validation errors.', details: errors },
        { status: 422 }
      );
    }

    const updatePayload = {
      business_name: businessName,
      business_phone: phoneValidation.normalized,
      business_email: businessEmail,
      default_whatsapp_template: template,
      timezone: timezone,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const supabase = adminClient || (await createClient());

      // Check if row exists, or insert initial row if empty
      const { data: existing } = await supabase.from('settings').select('id').limit(1).maybeSingle();

      let savedData: BusinessSettings | null = null;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('settings')
          .update(updatePayload)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) {
          console.error('Failed to update settings in Supabase:', error);
          return NextResponse.json(
            { error: 'Failed to save settings to the database.' },
            { status: 500 }
          );
        }
        savedData = data as BusinessSettings;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert(updatePayload)
          .select('*')
          .single();

        if (error) {
          console.error('Failed to insert settings in Supabase:', error);
          return NextResponse.json(
            { error: 'Failed to initialize settings in the database.' },
            { status: 500 }
          );
        }
        savedData = data as BusinessSettings;
      }

      // Invalidate relevant server caches
      try {
        revalidatePath('/admin');
        revalidatePath('/admin/settings');
        revalidatePath('/admin/members');
      } catch (cacheErr) {
        console.warn('Cache revalidation warning:', cacheErr);
      }

      return NextResponse.json({
        success: true,
        settings: savedData,
        message: 'Settings updated successfully.',
      });
    } else {
      // In-memory fallback
      const mockSaved: BusinessSettings = {
        id: 'default-settings',
        ...updatePayload,
      };
      return NextResponse.json({
        success: true,
        settings: mockSaved,
        message: 'Settings updated in local memory.',
      });
    }
  } catch (err: unknown) {
    console.error('API /api/admin/settings PATCH error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred while updating settings.' },
      { status: 500 }
    );
  }
}
