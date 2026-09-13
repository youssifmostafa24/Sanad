const AUTH_STORAGE_KEY = 'sanad_teacher_authenticated_v1';
export const TEACHER_PASSWORD = '122333';

/**
 * Normalizes Eastern Arabic numerals (١٢٣٤٥٦٧٨٩٠) to Western Arabic numerals (1234567890)
 * and verifies against the teacher password '122333'.
 */
export function verifyTeacherPassword(input: string): boolean {
  if (!input) return false;
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return normalized === TEACHER_PASSWORD;
}

/**
 * Checks if the user is authenticated as teacher on this device/browser.
 */
export function isTeacherAuthenticatedStored(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Saves teacher authentication state to localStorage.
 */
export function setTeacherAuthenticatedStored(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}
