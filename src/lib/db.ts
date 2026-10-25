import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { User, JobDescription, CreateJobInput, UpdateJobInput } from './types';

// Check if PostgreSQL connection URL is provided (supports DATABASE_URL, POSTGRES_URL, etc.)
function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
}

const isPostgresConfigured = Boolean(getDatabaseUrl());

let pgPool: Pool | null = null;
let pgInitialized = false;

function getPgPool(): Pool {
  if (!pgPool) {
    const connectionString = getDatabaseUrl()!;
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    pgPool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
    });
  }
  return pgPool;
}

async function initPostgres(): Promise<void> {
  if (pgInitialized || !isPostgresConfigured) return;
  const pool = getPgPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS job_descriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      role_title TEXT,
      location TEXT,
      job_type TEXT,
      salary_range TEXT,
      description TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Saved',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jd_user ON job_descriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_jd_company ON job_descriptions(user_id, company_name);
  `);

  pgInitialized = true;
}

// ----------------------------------------------------
// Local File Storage Fallback (Zero Config for Dev)
// ----------------------------------------------------
interface LocalStoreSchema {
  users: User[];
  jobDescriptions: JobDescription[];
}

const LOCAL_DIR = path.join(process.cwd(), '.local_data');
const LOCAL_FILE = path.join(LOCAL_DIR, 'jd_store.json');

async function getLocalStore(): Promise<LocalStoreSchema> {
  try {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    const content = await fs.readFile(LOCAL_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const defaultData: LocalStoreSchema = { users: [], jobDescriptions: [] };
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.writeFile(LOCAL_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

async function saveLocalStore(data: LocalStoreSchema): Promise<void> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// Unified Database Operations
// ----------------------------------------------------

export async function isUsingCloudDatabase(): Promise<boolean> {
  return isPostgresConfigured;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const normalizedUsername = username.trim().toLowerCase();

  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT id, username, password_hash, created_at FROM users WHERE LOWER(username) = $1 LIMIT 1',
      [normalizedUsername]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      password_hash: row.password_hash,
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  // Local file fallback
  const store = await getLocalStore();
  const user = store.users.find((u) => u.username.toLowerCase() === normalizedUsername);
  return user || null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT id, username, password_hash, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      username: row.username,
      password_hash: row.password_hash,
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  const store = await getLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function createUser(username: string, passwordHash: string): Promise<User> {
  const newUser: User = {
    id: crypto.randomUUID(),
    username: username.trim(),
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };

  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    await pool.query(
      'INSERT INTO users (id, username, password_hash, created_at) VALUES ($1, $2, $3, $4)',
      [newUser.id, newUser.username, newUser.password_hash, newUser.created_at]
    );
    return newUser;
  }

  const store = await getLocalStore();
  store.users.push(newUser);
  await saveLocalStore(store);
  return newUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    // job_descriptions has ON DELETE CASCADE in postgres
    const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  const store = await getLocalStore();
  const initialUserCount = store.users.length;
  store.users = store.users.filter((u) => u.id !== id);
  store.jobDescriptions = store.jobDescriptions.filter((j) => j.user_id !== id);

  if (store.users.length !== initialUserCount) {
    await saveLocalStore(store);
    return true;
  }
  return false;
}

export async function getJobDescriptions(
  userId: string,
  searchQuery?: string
): Promise<JobDescription[]> {
  const trimmedSearch = searchQuery ? searchQuery.trim().toLowerCase() : '';

  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    let query = `
      SELECT id, user_id, company_name, role_title, location, job_type, salary_range, description, notes, status, created_at, updated_at
      FROM job_descriptions
      WHERE user_id = $1
    `;
    const params: (string | number)[] = [userId];

    if (trimmedSearch) {
      query += ` AND (LOWER(company_name) LIKE $2 OR LOWER(COALESCE(role_title, '')) LIKE $2)`;
      params.push(`%${trimmedSearch}%`);
    }

    query += ' ORDER BY created_at DESC';

    const res = await pool.query(query, params);
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      role_title: row.role_title || '',
      location: row.location || '',
      job_type: row.job_type || '',
      salary_range: row.salary_range || '',
      description: row.description,
      notes: row.notes || '',
      status: row.status || 'Saved',
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    }));
  }

  // Local file fallback
  const store = await getLocalStore();
  let list = store.jobDescriptions.filter((jd) => jd.user_id === userId);

  if (trimmedSearch) {
    list = list.filter(
      (jd) =>
        jd.company_name.toLowerCase().includes(trimmedSearch) ||
        (jd.role_title && jd.role_title.toLowerCase().includes(trimmedSearch))
    );
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getJobDescriptionById(
  id: string,
  userId: string
): Promise<JobDescription | null> {
  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    const res = await pool.query(
      `SELECT id, user_id, company_name, role_title, location, job_type, salary_range, description, notes, status, created_at, updated_at
       FROM job_descriptions
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, userId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      role_title: row.role_title || '',
      location: row.location || '',
      job_type: row.job_type || '',
      salary_range: row.salary_range || '',
      description: row.description,
      notes: row.notes || '',
      status: row.status || 'Saved',
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  const store = await getLocalStore();
  const jd = store.jobDescriptions.find((item) => item.id === id && item.user_id === userId);
  return jd || null;
}

export async function createJobDescription(
  userId: string,
  input: CreateJobInput
): Promise<JobDescription> {
  const now = new Date().toISOString();
  const newJd: JobDescription = {
    id: crypto.randomUUID(),
    user_id: userId,
    company_name: input.company_name.trim(),
    role_title: input.role_title?.trim() || '',
    location: input.location?.trim() || '',
    job_type: input.job_type?.trim() || 'Full-time',
    salary_range: input.salary_range?.trim() || '',
    description: input.description.trim(),
    notes: input.notes?.trim() || '',
    status: input.status || 'Saved',
    created_at: now,
    updated_at: now,
  };

  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO job_descriptions (
        id, user_id, company_name, role_title, location, job_type, salary_range, description, notes, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newJd.id,
        newJd.user_id,
        newJd.company_name,
        newJd.role_title,
        newJd.location,
        newJd.job_type,
        newJd.salary_range,
        newJd.description,
        newJd.notes,
        newJd.status,
        newJd.created_at,
        newJd.updated_at,
      ]
    );
    return newJd;
  }

  const store = await getLocalStore();
  store.jobDescriptions.push(newJd);
  await saveLocalStore(store);
  return newJd;
}

export async function updateJobDescription(
  userId: string,
  input: UpdateJobInput
): Promise<JobDescription | null> {
  const existing = await getJobDescriptionById(input.id, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: JobDescription = {
    ...existing,
    company_name: input.company_name !== undefined ? input.company_name.trim() : existing.company_name,
    role_title: input.role_title !== undefined ? input.role_title.trim() : existing.role_title,
    location: input.location !== undefined ? input.location.trim() : existing.location,
    job_type: input.job_type !== undefined ? input.job_type.trim() : existing.job_type,
    salary_range: input.salary_range !== undefined ? input.salary_range.trim() : existing.salary_range,
    description: input.description !== undefined ? input.description.trim() : existing.description,
    notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
    status: input.status !== undefined ? input.status : existing.status,
    updated_at: now,
  };

  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    await pool.query(
      `UPDATE job_descriptions SET
        company_name = $1,
        role_title = $2,
        location = $3,
        job_type = $4,
        salary_range = $5,
        description = $6,
        notes = $7,
        status = $8,
        updated_at = $9
       WHERE id = $10 AND user_id = $11`,
      [
        updated.company_name,
        updated.role_title,
        updated.location,
        updated.job_type,
        updated.salary_range,
        updated.description,
        updated.notes,
        updated.status,
        updated.updated_at,
        updated.id,
        userId,
      ]
    );
    return updated;
  }

  const store = await getLocalStore();
  const idx = store.jobDescriptions.findIndex((j) => j.id === input.id && j.user_id === userId);
  if (idx === -1) return null;
  store.jobDescriptions[idx] = updated;
  await saveLocalStore(store);
  return updated;
}

export async function deleteJobDescription(id: string, userId: string): Promise<boolean> {
  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();
    const res = await pool.query(
      'DELETE FROM job_descriptions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  const store = await getLocalStore();
  const initialLength = store.jobDescriptions.length;
  store.jobDescriptions = store.jobDescriptions.filter(
    (item) => !(item.id === id && item.user_id === userId)
  );
  if (store.jobDescriptions.length !== initialLength) {
    await saveLocalStore(store);
    return true;
  }
  return false;
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  total: number;
}

export async function importJobDescriptions(
  userId: string,
  items: Array<CreateJobInput>,
  skipDuplicates = true
): Promise<ImportResult> {
  const validItems = items.filter(
    (item) =>
      item &&
      typeof item.company_name === 'string' &&
      item.company_name.trim().length > 0 &&
      typeof item.description === 'string' &&
      item.description.trim().length > 0
  );

  let importedCount = 0;
  let skippedCount = items.length - validItems.length;

  if (isPostgresConfigured) {
    await initPostgres();
    const pool = getPgPool();

    // Fetch existing records for duplicate check
    const existingRes = await pool.query(
      'SELECT company_name, role_title FROM job_descriptions WHERE user_id = $1',
      [userId]
    );
    const existingKeys = new Set(
      existingRes.rows.map(
        (r) => `${r.company_name.toLowerCase().trim()}___${(r.role_title || '').toLowerCase().trim()}`
      )
    );

    for (const item of validItems) {
      const key = `${item.company_name.toLowerCase().trim()}___${(item.role_title || '').toLowerCase().trim()}`;
      if (skipDuplicates && existingKeys.has(key)) {
        skippedCount++;
        continue;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const status =
        item.status && ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].includes(item.status)
          ? item.status
          : 'Saved';

      await pool.query(
        `INSERT INTO job_descriptions (
          id, user_id, company_name, role_title, location, job_type, salary_range, description, notes, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          userId,
          item.company_name.trim(),
          item.role_title?.trim() || '',
          item.location?.trim() || '',
          item.job_type?.trim() || 'Full-time',
          item.salary_range?.trim() || '',
          item.description.trim(),
          item.notes?.trim() || '',
          status,
          now,
          now,
        ]
      );
      existingKeys.add(key);
      importedCount++;
    }

    return { importedCount, skippedCount, total: items.length };
  }

  // Local JSON store fallback
  const store = await getLocalStore();
  const existingKeys = new Set(
    store.jobDescriptions
      .filter((j) => j.user_id === userId)
      .map((j) => `${j.company_name.toLowerCase().trim()}___${(j.role_title || '').toLowerCase().trim()}`)
  );

  for (const item of validItems) {
    const key = `${item.company_name.toLowerCase().trim()}___${(item.role_title || '').toLowerCase().trim()}`;
    if (skipDuplicates && existingKeys.has(key)) {
      skippedCount++;
      continue;
    }

    const now = new Date().toISOString();
    const status =
      item.status && ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].includes(item.status)
        ? item.status
        : 'Saved';

    const newJd: JobDescription = {
      id: crypto.randomUUID(),
      user_id: userId,
      company_name: item.company_name.trim(),
      role_title: item.role_title?.trim() || '',
      location: item.location?.trim() || '',
      job_type: item.job_type?.trim() || 'Full-time',
      salary_range: item.salary_range?.trim() || '',
      description: item.description.trim(),
      notes: item.notes?.trim() || '',
      status,
      created_at: now,
      updated_at: now,
    };

    store.jobDescriptions.push(newJd);
    existingKeys.add(key);
    importedCount++;
  }

  if (importedCount > 0) {
    await saveLocalStore(store);
  }

  return { importedCount, skippedCount, total: items.length };
}
