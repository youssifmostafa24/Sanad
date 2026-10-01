import { AuthState } from '../types';

/**
 * ============================================================================
 * SECURITY NOTICE & ARCHITECTURAL NOTE:
 * ============================================================================
 * Currently, authentication and role verification occur on the client side.
 * While this gates the UI elements and prevents unauthorized mutations in the
 * browser interface, true production-grade authorization MUST ultimately be
 * enforced server-side.
 * 
 * TODO for Production Hardening:
 * - Implement Supabase Row Level Security (RLS) policies keyed to family_id.
 * - Issue cryptographic JWTs or server-verified session tokens containing
 *   the verified user role ('teacher' or 'parent') and scoped family_id.
 * - Verify token claims on all Supabase INSERT, UPDATE, and DELETE operations.
 * ============================================================================
 */

/**
 * Central permission helper function.
 * Determines whether the given auth state is permitted to edit data for a target family.
 *
 * - 'teacher': Full edit access to all families.
 * - 'parent': Edit access ONLY for their own scopedFamilyId, never for other families.
 * - 'student' / unauthenticated: Read-only access (no edit permissions).
 */
export function canEdit(auth: AuthState, targetFamilyId?: string): boolean {
  if (auth.role === 'teacher') return true;
  if (auth.role === 'parent') {
    return Boolean(targetFamilyId && auth.scopedFamilyId === targetFamilyId);
  }
  return false;
}
