import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { devSampleMembers } from '@/lib/data/devSamples';
import { hydrateMemberV2 } from '@/lib/utils/memberProfile';
import { calculateAge, formatDate } from '@/lib/utils/formatting';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const gender = searchParams.get('gender') || '';
    const status = searchParams.get('status') || '';

    let rawMembers: Record<string, unknown>[] = [];

    if (isSupabaseConfigured) {
      const adminClient = createAdminClient();
      const supabase = adminClient || (await createClient());

      let query = supabase.from('members').select('*');

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,phone.ilike.%${search}%,reg_id.ilike.%${search}%,location_city.ilike.%${search}%`
        );
      }

      if (gender) {
        query = query.eq('gender', gender);
      }

      if (status === 'matched') {
        query = query.eq('profile_status', 'matched');
      } else if (status === 'inactive') {
        query = query.in('profile_status', ['inactive', 'archived']);
      } else if (status === 'all' || status === 'all_records') {
        // All
      } else if (status) {
        query = query.eq('profile_status', status);
      } else {
        query = query.not('profile_status', 'in', '("matched","inactive","archived")');
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Supabase export error:', error);
        return NextResponse.json({ error: 'Failed to query database for export.' }, { status: 500 });
      }

      rawMembers = (data || []) as Record<string, unknown>[];
    } else {
      let filtered = [...devSampleMembers];
      if (search) {
        filtered = filtered.filter(
          (m) =>
            m.full_name.toLowerCase().includes(search) ||
            m.phone.includes(search) ||
            m.reg_id.toLowerCase().includes(search)
        );
      }
      if (gender) filtered = filtered.filter((m) => m.gender === gender);
      if (status === 'matched') {
        filtered = filtered.filter((m) => m.profile_status === 'matched');
      } else if (status === 'inactive') {
        filtered = filtered.filter((m) => m.profile_status === 'inactive' || m.profile_status === 'archived');
      } else if (status === 'all' || status === 'all_records') {
        // All
      } else if (status) {
        filtered = filtered.filter((m) => m.profile_status === status);
      } else {
        filtered = filtered.filter((m) => m.profile_status !== 'matched' && m.profile_status !== 'inactive' && m.profile_status !== 'archived');
      }
      rawMembers = filtered as unknown as Record<string, unknown>[];
    }

    // Function to sanitize strings, strip illegal XML control characters (ASCII < 32),
    // and neutralize spreadsheet formula injection (=, +, -, @, \t, \r)
    const sanitizeCell = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      let str = String(val).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
      // Prefix formula characters with a single quote to prevent spreadsheet formula execution
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return str;
    };

    // Hydrate all member records to extract V2 fields
    const hydratedMembers = rawMembers.map((m) => hydrateMemberV2(m));

    // Map to sanitized tabular format
    // CRITICAL: Sensitive health information (Section D) is strictly excluded
    const exportRows = hydratedMembers.map((m) => ({
      'Reg ID': sanitizeCell(m.reg_id),
      'Full Name': sanitizeCell(m.full_name),
      'Gender': sanitizeCell(m.gender),
      'Date of Birth': sanitizeCell(m.dob),
      'Age': calculateAge(m.dob) || '',
      'Phone Number': sanitizeCell(m.phone),
      'Email': sanitizeCell(m.email),
      'Marital Status': sanitizeCell(m.marital_status),
      'Kulam': sanitizeCell(m.kulam || m.caste),
      'Height (cm)': sanitizeCell(m.height_cm),
      'Place of Living': sanitizeCell(m.place_of_living || m.location_city),
      'State': sanitizeCell(m.location_state),
      'Siblings': sanitizeCell(m.siblings),
      'College Degree': sanitizeCell(m.college_degree || m.education),
      'College / University': sanitizeCell(m.college_name),
      'School': sanitizeCell(m.school_name),
      'Other Education': sanitizeCell(m.education_other),
      'Parents Details': sanitizeCell(m.parents_details),
      'Parents Origin': sanitizeCell(m.parents_origin),
      'Employment Status': sanitizeCell(m.employment_status || m.occupation),
      'Employer / Company': sanitizeCell(m.employer_name),
      'Job Title': sanitizeCell(m.job_title || m.occupation),
      'Salary Details': sanitizeCell(m.salary_info || m.annual_income),
      'Business Details': sanitizeCell(m.business_details),
      'Monthly Income (INR)': sanitizeCell(m.monthly_income),
      'Passive Income (INR)': sanitizeCell(m.passive_income),
      'Passive Income Frequency': sanitizeCell(m.passive_income_type),
      'Property Details': sanitizeCell(m.property_details),
      'LinkedIn Profile': sanitizeCell(m.linkedin_url),
      'Profile Status': sanitizeCell(m.profile_status).toUpperCase(),
      'Registration Date': formatDate(m.created_at),
    }));

    // Create worksheet using xlsx
    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto-fit column widths
    const columnWidths = Object.keys(exportRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 16),
    }));
    worksheet['!cols'] = columnWidths;

    const format = (searchParams.get('format') || 'xlsx').toLowerCase().trim();
    const todayStr = new Date().toISOString().split('T')[0];

    // CSV format export option
    if (format === 'csv') {
      const csvData = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
      const filename = `Achintya_Matrimony_Members_${todayStr}.csv`;
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Standard Excel .xlsx format with DEFLATE compression enabled
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Achintya Members');

    const arrayBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
      compression: true,
    }) as ArrayBuffer;

    const filename = `Achintya_Matrimony_Members_${todayStr}.xlsx`;
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'digest' in err &&
      typeof (err as { digest: unknown }).digest === 'string'
    ) {
      throw err;
    }
    console.error('API /api/admin/members/export error:', err);
    return NextResponse.json({ error: 'Failed to generate Excel export.' }, { status: 500 });
  }
}
