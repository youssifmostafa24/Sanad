import { Student, TeacherNote, FocusPoint } from '../types';

const TEACHER_NOTES_STORAGE_KEY = 'sanad_teacher_private_notes_v1';

/**
 * Loads private teacher notes from dedicated teacher storage.
 * MUST only be called when teacher mode is verified active.
 */
export function getTeacherNotesForStudent(studentId: string): TeacherNote[] {
  try {
    const raw = localStorage.getItem(TEACHER_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const allNotes: Record<string, TeacherNote[]> = JSON.parse(raw);
    return allNotes[studentId] || [];
  } catch (e) {
    console.error('Failed to load private teacher notes:', e);
    return [];
  }
}

/**
 * Persists private teacher notes to dedicated teacher storage.
 * MUST only be called when teacher mode is verified active.
 */
export function setTeacherNotesForStudent(studentId: string, notes: TeacherNote[]): void {
  try {
    const raw = localStorage.getItem(TEACHER_NOTES_STORAGE_KEY);
    const allNotes: Record<string, TeacherNote[]> = raw ? JSON.parse(raw) : {};
    allNotes[studentId] = notes;
    localStorage.setItem(TEACHER_NOTES_STORAGE_KEY, JSON.stringify(allNotes));
  } catch (e) {
    console.error('Failed to save private teacher notes:', e);
  }
}

/**
 * Migrates existing memorizationFocus text into focusPoints if not already migrated.
 * Keeps the old field untouched as a backup.
 */
export function getMigratedFocusPoints(student: Student): FocusPoint[] {
  if (student.focusPoints && student.focusPoints.length > 0) {
    return [...student.focusPoints].sort((a, b) => a.order - b.order);
  }
  if (student.memorizationFocus && student.memorizationFocus.trim()) {
    const lines = student.memorizationFocus
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.map((text, idx) => ({
      id: `fp-migrated-${idx + 1}-${Math.random().toString(36).substring(2, 8)}`,
      text,
      order: idx + 1,
      updatedAt: new Date().toISOString(),
    }));
  }
  return [];
}

/**
 * Formats date as e.g. "Thu 1 Oct"
 */
export function formatNoteDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

/**
 * Formats date as e.g. "Updated 1 Oct 2026"
 */
export function formatLastUpdatedDate(points: FocusPoint[]): string {
  if (!points || points.length === 0) return '';
  const sorted = [...points].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const latest = sorted[0];
  if (!latest || !latest.updatedAt) return '';
  try {
    const d = new Date(latest.updatedAt);
    if (isNaN(d.getTime())) return '';
    return 'Updated ' + d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
