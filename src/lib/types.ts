export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export type ApplicationStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

export interface JobDescription {
  id: string;
  user_id: string;
  company_name: string;
  role_title?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
  description: string;
  notes?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  company_name: string;
  role_title?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
  description: string;
  notes?: string;
  status?: ApplicationStatus;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  id: string;
}
