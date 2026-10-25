import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getJobDescriptions } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  const jobs = await getJobDescriptions(session.userId);
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    const headers = [
      'Company Name',
      'Role / Title',
      'Location',
      'Job Type',
      'Salary (INR)',
      'Status',
      'Notes',
      'Saved Date',
      'Full Description',
    ];

    const escapeCsv = (str?: string) => {
      if (!str) return '""';
      let clean = str;
      // Prevent CSV Formula Injection (DDE) in spreadsheet software
      if (/^[=+\-@\t\r]/.test(clean)) {
        clean = "'" + clean;
      }
      return `"${clean.replace(/"/g, '""')}"`;
    };

    const rows = jobs.map((j) => [
      escapeCsv(j.company_name),
      escapeCsv(j.role_title),
      escapeCsv(j.location),
      escapeCsv(j.job_type),
      escapeCsv(j.salary_range),
      escapeCsv(j.status),
      escapeCsv(j.notes),
      escapeCsv(new Date(j.created_at).toLocaleDateString()),
      escapeCsv(j.description),
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="jd_store_${dateStr}.csv"`,
      },
    });
  }

  // Default: JSON Export
  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'Job Description Store',
    total_records: jobs.length,
    jobs: jobs.map((j) => ({
      company_name: j.company_name,
      role_title: j.role_title || '',
      location: j.location || '',
      job_type: j.job_type || 'Full-time',
      salary_range: j.salary_range || '',
      status: j.status,
      description: j.description,
      notes: j.notes || '',
      created_at: j.created_at,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="jd_store_${dateStr}.json"`,
    },
  });
}
