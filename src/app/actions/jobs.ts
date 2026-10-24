'use server';

import { getSession } from '@/lib/auth';
import {
  getJobDescriptions,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription,
  isUsingCloudDatabase,
} from '@/lib/db';
import { JobDescription, CreateJobInput } from '@/lib/types';
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

  if (!data.description?.trim()) {
    return { success: false, error: 'Job description is required.' };
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
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');
    return { success: true, job: result };
  } catch (err: unknown) {
    console.error('saveJobAction error:', err);
    return { success: false, error: 'Failed to save job description.' };
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
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');
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
