import { AuthState, Family } from '../types';

/**
 * ============================================================================
 * SECURITY NOTICE & ARCHITECTURAL WARNING:
 * ============================================================================
 * Authentication currently operates client-side for rapid prototype feedback.
 * Anyone with access to browser developer tools can inspect JavaScript state
 * or attempt client-side bypasses.
 *
 * For production deployment:
 * Enforcement must happen server-side via Supabase Row Level Security (RLS)
 * policies keyed to family_id, combined with server-verified auth tokens.
 * Do not rely solely on client-side state for confidential or multi-tenant write ops.
 * ============================================================================
 */

const AUTH_STORAGE_KEY_V2 = 'sanad_auth_state_v2';
const LEGACY_TEACHER_KEY = 'sanad_teacher_authenticated_v1';
export const TEACHER_PASSWORD = '122333';

/**
 * Normalizes Eastern Arabic numerals (١٢٣٤٥٦٧٨٩٠) to Western Arabic numerals (1234567890).
 */
export function normalizePasswordInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

/**
 * Hashes a plaintext password using SHA-256 via Web Crypto API.
 */
export async function hashPassword(password: string): Promise<string> {
  const normalized = normalizePasswordInput(password);
  if (!normalized) return '';
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies against the teacher password '122333'.
 */
export function verifyTeacherPassword(input: string): boolean {
  if (!input) return false;
  return normalizePasswordInput(input) === TEACHER_PASSWORD;
}

/**
 * Verifies a submitted password against the teacher password and all families' parent password hashes.
 * Returns the resolved AuthState on success, or null if invalid.
 */
export async function authenticateWithPassword(
  passwordInput: string,
  families: Family[]
): Promise<AuthState | null> {
  if (!passwordInput) return null;

  // 1. Check against the main teacher password
  if (verifyTeacherPassword(passwordInput)) {
    return { role: 'teacher' };
  }

  // 2. Loop through all families to check for parent password matches
  const normalized = normalizePasswordInput(passwordInput);
  const hashed = await hashPassword(passwordInput);

  for (const fam of families) {
    if (fam.parentPasswordHash) {
      if (fam.parentPasswordHash === hashed || fam.parentPasswordHash === normalized) {
        return {
          role: 'parent',
          scopedFamilyId: fam.id,
        };
      }
    }
  }

  return null;
}

/**
 * Retrieves the stored role-based auth state from localStorage.
 */
export function getStoredAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'teacher' || parsed.role === 'parent' || parsed.role === 'student')) {
        return parsed as AuthState;
      }
    }
    // Backward compatibility with legacy teacher auth
    if (localStorage.getItem(LEGACY_TEACHER_KEY) === 'true') {
      return { role: 'teacher' };
    }
  } catch {
    // ignore
  }
  return { role: 'student' };
}

/**
 * Persists the role-based auth state to localStorage.
 */
export function setStoredAuthState(auth: AuthState): void {
  try {
    if (auth.role === 'student') {
      localStorage.removeItem(AUTH_STORAGE_KEY_V2);
      localStorage.removeItem(LEGACY_TEACHER_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY_V2, JSON.stringify(auth));
      if (auth.role === 'teacher') {
        localStorage.setItem(LEGACY_TEACHER_KEY, 'true');
      } else {
        localStorage.removeItem(LEGACY_TEACHER_KEY);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Legacy compatibility helpers
 */
export function isTeacherAuthenticatedStored(): boolean {
  return getStoredAuthState().role === 'teacher';
}

export function setTeacherAuthenticatedStored(authenticated: boolean): void {
  setStoredAuthState(authenticated ? { role: 'teacher' } : { role: 'student' });
}
