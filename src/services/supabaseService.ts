import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { Family, Student, Entry, SurahMemorizationStatus, ManualWeeklyStars, GradeValue } from '../types';
import { getInitialData } from '../data/seedData';
import { normalizeQuranHomeworkText } from '../data/quranSurahs';

export interface SupabaseHomeworkRow {
  id: string;
  student_id: string;
  date: string;
  hifz_text: string | null;
  hifz_grade: number | null;
  murajaa_text: string | null;
  murajaa_grade: number | null;
  created_at?: string;
}

export interface SupabaseStudentRow {
  id: string;
  family_id?: string | null;
  name: string;
  arabic_name?: string | null;
  color: string;
  attendance_days?: number[] | null;
  tilawa_surah?: number | null;
  tilawa_ayah?: number | null;
  surah_ratings?: Record<number, SurahMemorizationStatus> | null;
  manual_weekly_stars?: ManualWeeklyStars[] | null;
  created_at?: string;
}

export interface SupabaseFamilyRow {
  id: string;
  name: string;
  student_ids: string[];
  attendance_days?: number[] | null;
  created_at?: string;
}

/**
 * Fetch all application data (families, students, and all homework entries) from Supabase.
 * If Supabase is connected but tables are empty, it automatically seeds initial data.
 */
export async function fetchAllDataFromSupabase(): Promise<{
  families: Family[];
  students: Student[];
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Fetch families
    const { data: familiesData, error: familiesErr } = await client
      .from('families')
      .select('*')
      .order('id', { ascending: true });

    if (familiesErr) {
      console.warn('Error fetching families from Supabase:', familiesErr.message);
      return null;
    }

    // 2. Fetch students
    const { data: studentsData, error: studentsErr } = await client
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (studentsErr) {
      console.warn('Error fetching students from Supabase:', studentsErr.message);
      return null;
    }

    // If tables are completely empty, seed them automatically
    if ((!familiesData || familiesData.length === 0) && (!studentsData || studentsData.length === 0)) {
      console.log('Supabase tables are empty. Seeding initial data...');
      await seedInitialDataToSupabase();
      return fetchAllDataFromSupabase();
    }

    // 3. Fetch all entries
    const { data: entriesData, error: entriesErr } = await client
      .from('homework_entries')
      .select('*')
      .order('date', { ascending: false });

    if (entriesErr) {
      console.warn('Error fetching homework entries from Supabase:', entriesErr.message);
    }

    const entriesByStudentId: Record<string, Entry[]> = {};
    (entriesData || []).forEach((row: SupabaseHomeworkRow) => {
      if (!entriesByStudentId[row.student_id]) {
        entriesByStudentId[row.student_id] = [];
      }
      entriesByStudentId[row.student_id].push({
        id: row.id,
        date: row.date,
        hifzText: normalizeQuranHomeworkText(row.hifz_text || ''),
        hifzGrade: row.hifz_grade as GradeValue | null,
        murajaaText: normalizeQuranHomeworkText(row.murajaa_text || ''),
        murajaaGrade: row.murajaa_grade as GradeValue | null,
      });
    });

    // Assemble Students
    const assembledStudents: Student[] = (studentsData || []).map((stRow: SupabaseStudentRow) => {
      return {
        id: stRow.id,
        name: stRow.name,
        arabicName: stRow.arabic_name || undefined,
        color: stRow.color || '#0E5C56',
        attendanceDays: Array.isArray(stRow.attendance_days) ? stRow.attendance_days : [1, 5],
        tilawaSurah: stRow.tilawa_surah || 1,
        tilawaAyah: stRow.tilawa_ayah || 1,
        surahRatings: stRow.surah_ratings || {},
        manualWeeklyStars: Array.isArray(stRow.manual_weekly_stars) ? stRow.manual_weekly_stars : [],
        entries: entriesByStudentId[stRow.id] || [],
      };
    });

    // Assemble Families
    const assembledFamilies: Family[] = (familiesData || []).map((fRow: SupabaseFamilyRow) => {
      return {
        id: fRow.id,
        name: fRow.name,
        studentIds: Array.isArray(fRow.student_ids) ? fRow.student_ids : [],
        attendanceDays: Array.isArray(fRow.attendance_days) ? fRow.attendance_days : [1, 5],
      };
    });

    return {
      families: assembledFamilies,
      students: assembledStudents,
    };
  } catch (error) {
    console.error('Unexpected error connecting to Supabase:', error);
    return null;
  }
}

/**
 * Seed initial sample data to Supabase if newly created tables are empty
 */
export async function seedInitialDataToSupabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const initial = getInitialData();

    // 1. Insert families
    const familiesToInsert = initial.families.map((f) => ({
      id: f.id,
      name: f.name,
      student_ids: f.studentIds,
      attendance_days: f.attendanceDays || [1, 5],
    }));

    const { error: famErr } = await client
      .from('families')
      .upsert(familiesToInsert, { onConflict: 'id' });

    if (famErr) {
      console.error('Failed to seed families:', famErr);
      return false;
    }

    // 2. Insert students
    const studentsToInsert = initial.students.map((s) => ({
      id: s.id,
      name: s.name,
      arabic_name: s.arabicName || null,
      color: s.color,
      attendance_days: s.attendanceDays || [1, 5],
      tilawa_surah: s.tilawaSurah || 1,
      tilawa_ayah: s.tilawaAyah || 1,
      surah_ratings: s.surahRatings || {},
      manual_weekly_stars: s.manualWeeklyStars || [],
    }));

    const { error: stErr } = await client
      .from('students')
      .upsert(studentsToInsert, { onConflict: 'id' });

    if (stErr) {
      console.error('Failed to seed students:', stErr);
      return false;
    }

    // 3. Insert homework entries
    const entriesToInsert: SupabaseHomeworkRow[] = [];
    initial.students.forEach((s) => {
      (s.entries || []).forEach((e) => {
        entriesToInsert.push({
          id: e.id,
          student_id: s.id,
          date: e.date,
          hifz_text: e.hifzText,
          hifz_grade: e.hifzGrade,
          murajaa_text: e.murajaaText,
          murajaa_grade: e.murajaaGrade,
        });
      });
    });

    if (entriesToInsert.length > 0) {
      const { error: entriesErr } = await client
        .from('homework_entries')
        .upsert(entriesToInsert, { onConflict: 'id' });

      if (entriesErr) {
        console.error('Failed to seed entries:', entriesErr);
        return false;
      }
    }

    console.log('Successfully seeded database in Supabase!');
    return true;
  } catch (err) {
    console.error('Error during initial Supabase seeding:', err);
    return false;
  }
}

/**
 * Upsert (insert or update) a single homework entry in Supabase
 */
export async function upsertEntryInSupabase(studentId: string, entry: Entry): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: SupabaseHomeworkRow = {
      id: entry.id,
      student_id: studentId,
      date: entry.date,
      hifz_text: entry.hifzText,
      hifz_grade: entry.hifzGrade,
      murajaa_text: entry.murajaaText,
      murajaa_grade: entry.murajaaGrade,
    };

    const { error } = await client
      .from('homework_entries')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert entry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving entry to Supabase:', err);
    return false;
  }
}

/**
 * Delete a homework entry from Supabase
 */
export async function deleteEntryInSupabase(entryId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('homework_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Supabase delete entry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting entry from Supabase:', err);
    return false;
  }
}

/**
 * Update a student's Surah memorization ratings
 */
export async function updateStudentSurahRatingsInSupabase(
  studentId: string,
  surahRatings: Record<number, SurahMemorizationStatus>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('students')
      .update({ surah_ratings: surahRatings })
      .eq('id', studentId);

    if (error) {
      console.error('Supabase update surah ratings error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating surah ratings in Supabase:', err);
    return false;
  }
}

/**
 * Update student Tilawa Surah & Ayah position
 */
export async function updateStudentTilawaInSupabase(
  studentId: string,
  tilawaSurah: number,
  tilawaAyah: number
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('students')
      .update({
        tilawa_surah: tilawaSurah,
        tilawa_ayah: tilawaAyah,
      })
      .eq('id', studentId);

    if (error) {
      console.error('Supabase update tilawa error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating tilawa in Supabase:', err);
    return false;
  }
}

/**
 * Update student attendance days
 */
export async function updateStudentAttendanceInSupabase(
  studentId: string,
  attendanceDays: number[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('students')
      .update({ attendance_days: attendanceDays })
      .eq('id', studentId);

    if (error) {
      console.error('Supabase update attendance error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating attendance in Supabase:', err);
    return false;
  }
}

/**
 * Update family attendance days
 */
export async function updateFamilyAttendanceInSupabase(
  familyId: string,
  attendanceDays: number[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('families')
      .update({ attendance_days: attendanceDays })
      .eq('id', familyId);

    if (error) {
      console.error('Supabase update family attendance error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating family attendance in Supabase:', err);
    return false;
  }
}

/**
 * Realtime subscriptions: Listen to changes on entries, students, or families
 */
export function subscribeToSupabaseChanges(onDataChange: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'homework_entries' },
        () => onDataChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => onDataChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'families' },
        () => onDataChange()
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to establish Supabase real-time channel:', err);
    return () => {};
  }
}
