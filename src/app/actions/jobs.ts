'use server';

import { getSession } from '@/lib/auth';
import {
  getJobDescriptions,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription,
  isUsingCloudDatabase,
  importJobDescriptions,
  ImportResult,
} from '@/lib/db';
import { JobDescription, CreateJobInput, ApplicationStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getJobsAction(search?: string): Promise<{ success: boolean; jobs?: JobDescription[]; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  try {
    const jobs = await getJobDescriptions(session.userId, search);
    return { success: true, jobs };
  } catch (err: unknown) {
    console.error('getJobsAction error:', err);
    return { success: false, error: 'Failed to fetch job descriptions.' };
  }
}

export async function getJobByIdAction(id: string): Promise<{ success: boolean; job?: JobDescription | null; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  try {
    const { getJobDescriptionById } = await import('@/lib/db');
    const job = await getJobDescriptionById(id, session.userId);
    if (!job) {
      return { success: false, error: 'Job description not found.' };
    }
    return { success: true, job };
  } catch (err: unknown) {
    console.error('getJobByIdAction error:', err);
    return { success: false, error: 'Failed to retrieve job description.' };
  }
}

export async function saveJobAction(
  data: CreateJobInput & { id?: string }
): Promise<{ success: boolean; job?: JobDescription; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  if (!data.company_name?.trim()) {
    return { success: false, error: 'Company name is required.' };
  }

  if (data.company_name.length > 255) {
    return { success: false, error: 'Company name cannot exceed 255 characters.' };
  }

  if (data.role_title && data.role_title.length > 255) {
    return { success: false, error: 'Role title cannot exceed 255 characters.' };
  }

  if (data.location && data.location.length > 255) {
    return { success: false, error: 'Location cannot exceed 255 characters.' };
  }

  if (data.salary_range && data.salary_range.length > 255) {
    return { success: false, error: 'Salary range cannot exceed 255 characters.' };
  }

  if (!data.description?.trim()) {
    return { success: false, error: 'Job description is required.' };
  }

  if (data.description.length > 300000) {
    return { success: false, error: 'Job description cannot exceed 300,000 characters.' };
  }

  if (data.notes && data.notes.length > 50000) {
    return { success: false, error: 'Notes cannot exceed 50,000 characters.' };
  }

  try {
    let result: JobDescription | null;
    if (data.id) {
      result = await updateJobDescription(session.userId, {
        id: data.id,
        ...data,
      });
      if (!result) {
        return { success: false, error: 'Job description not found or permission denied.' };
      }
    } else {
      result = await createJobDescription(session.userId, data);
    }

    revalidatePath('/');
    return { success: true, job: result };
  } catch (err: unknown) {
    console.error('saveJobAction error:', err);
    return { success: false, error: 'Failed to save job description.' };
  }
}

export async function updateJobStatusAction(
  id: string,
  status: ApplicationStatus
): Promise<{ success: boolean; job?: JobDescription; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  try {
    const updated = await updateJobDescription(session.userId, { id, status });
    if (!updated) {
      return { success: false, error: 'Job description not found.' };
    }
    revalidatePath('/');
    revalidatePath(`/job/${id}`);
    return { success: true, job: updated };
  } catch (err: unknown) {
    console.error('updateJobStatusAction error:', err);
    return { success: false, error: 'Failed to update job status.' };
  }
}

export async function deleteJobAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  try {
    const success = await deleteJobDescription(id, session.userId);
    if (!success) {
      return { success: false, error: 'Record not found or failed to delete.' };
    }
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    console.error('deleteJobAction error:', err);
    return { success: false, error: 'Failed to delete job description.' };
  }
}

export async function getSystemInfoAction(): Promise<{ isCloud: boolean }> {
  const isCloud = await isUsingCloudDatabase();
  return { isCloud };
}

export async function importJobsAction(
  items: Array<CreateJobInput>,
  skipDuplicates = true
): Promise<{ success: boolean; result?: ImportResult; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'No job descriptions found to import.' };
  }

  if (items.length > 500) {
    return { success: false, error: 'Cannot import more than 500 job descriptions at once.' };
  }

  try {
    const result = await importJobDescriptions(session.userId, items, skipDuplicates);
    revalidatePath('/');
    return { success: true, result };
  } catch (err: unknown) {
    console.error('importJobsAction error:', err);
    return { success: false, error: 'Failed to import job descriptions.' };
  }
}

export async function exportJobsAction(): Promise<{ success: boolean; jobs?: JobDescription[]; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  try {
    const jobs = await getJobDescriptions(session.userId);
    return { success: true, jobs };
  } catch (err: unknown) {
    console.error('exportJobsAction error:', err);
    return { success: false, error: 'Failed to export job descriptions.' };
  }
}
