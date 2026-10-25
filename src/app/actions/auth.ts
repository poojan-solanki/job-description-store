'use server';

import { findUserByUsername, createUser } from '@/lib/db';
import { hashPassword, verifyPassword, setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
  };
}

// Constant dummy hash to mitigate user enumeration timing attacks
const DUMMY_HASH = '$2a$10$e8Q.2wKz5Uu0Z5gqY1z0Ae6kO4rU0m6kO4rU0m6kO4rU0m6kO4rU0';

export async function registerAction(formData: { username: string; password: string }): Promise<AuthResponse> {
  const username = formData.username?.trim();
  const password = formData.password?.trim();

  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }

  if (username.length > 50) {
    return { success: false, error: 'Username cannot exceed 50 characters.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (password.length > 128) {
    return { success: false, error: 'Password cannot exceed 128 characters.' };
  }

  try {
    const existing = await findUserByUsername(username);
    if (existing) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser(username, hashedPassword);

    // Set persistent httpOnly cookie session
    await setSessionCookie(newUser.id, newUser.username);

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    };
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return { success: false, error: 'Failed to create account. Please try again.' };
  }
}

export async function loginAction(formData: { username: string; password: string }): Promise<AuthResponse> {
  const username = formData.username?.trim();
  const password = formData.password?.trim();

  if (!username || !password) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  if (username.length > 50 || password.length > 128) {
    return { success: false, error: 'Invalid username or password.' };
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      // Execute dummy password verification to maintain constant-time response and prevent user enumeration
      await verifyPassword(password, DUMMY_HASH);
      return { success: false, error: 'Invalid username or password.' };
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // Set persistent httpOnly cookie session
    await setSessionCookie(user.id, user.username);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  } catch (err: unknown) {
    console.error('Login error:', err);
    return { success: false, error: 'Failed to sign in. Please try again.' };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return { success: false };
  }
}

export async function getCurrentUserAction(): Promise<{ id: string; username: string } | null> {
  const session = await getSession();
  if (!session) return null;
  return { id: session.userId, username: session.username };
}

export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { deleteUser } = await import('@/lib/db');
    const success = await deleteUser(session.userId);
    if (!success) {
      return { success: false, error: 'Failed to delete account' };
    }

    await clearSessionCookie();
    return { success: true };
  } catch (err: unknown) {
    console.error('Delete account error:', err);
    return { success: false, error: 'An unexpected error occurred while deleting account' };
  }
}
