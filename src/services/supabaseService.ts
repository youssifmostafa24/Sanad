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
  on_time_score?: number | null;
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
  motivational_message?: string | null;
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

    // 3. Fetch all entries (handle pagination in chunks of 1000 to ensure all historical entries are fetched)
    let allEntries: SupabaseHomeworkRow[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data: chunk, error: chunkErr } = await client
        .from('homework_entries')
        .select('*')
        .order('date', { ascending: false })
        .range(from, to);

      if (chunkErr) {
        console.warn('Error fetching homework entries chunk from Supabase:', chunkErr.message);
        break;
      }

      if (chunk && chunk.length > 0) {
        allEntries = allEntries.concat(chunk);
        if (chunk.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    const entriesByStudentId: Record<string, Entry[]> = {};
    allEntries.forEach((row: SupabaseHomeworkRow) => {
      const targetKey = row.student_id;
      if (!entriesByStudentId[targetKey]) {
        entriesByStudentId[targetKey] = [];
      }
      entriesByStudentId[targetKey].push({
        id: row.id,
        date: row.date,
        hifzText: normalizeQuranHomeworkText(row.hifz_text || ''),
        hifzGrade: row.hifz_grade as GradeValue | null,
        murajaaText: normalizeQuranHomeworkText(row.murajaa_text || ''),
        murajaaGrade: row.murajaa_grade as GradeValue | null,
        onTimeScore: row.on_time_score ?? null,
      });
    });

    // Helper to find matching entries for a student whether student_id matches exact ID or student name/slug
    const getEntriesForStudent = (stId: string, stName: string, stArabicName?: string | null): Entry[] => {
      // 1. Direct match on stId
      if (entriesByStudentId[stId] && entriesByStudentId[stId].length > 0) {
        return entriesByStudentId[stId];
      }
      // 2. Try normalized slug matches (e.g. 'ali' <-> 'student-ali', 'ibrahim' <-> 'student-ibrahim')
      const lowerId = stId.toLowerCase();
      const lowerName = (stName || '').toLowerCase().trim();
      const shortId = lowerId.replace(/^student-/, '');

      for (const [key, entries] of Object.entries(entriesByStudentId)) {
        const lowerKey = key.toLowerCase().trim();
        const shortKey = lowerKey.replace(/^student-/, '');
        if (
          lowerKey === lowerId ||
          shortKey === shortId ||
          shortKey === lowerName ||
          lowerKey === lowerName ||
          (stArabicName && lowerKey.includes(stArabicName.trim()))
        ) {
          return entries;
        }
      }
      return [];
    };

    // Assemble Students
    const assembledStudents: Student[] = (studentsData || []).map((stRow: SupabaseStudentRow) => {
      const studentEntries = getEntriesForStudent(stRow.id, stRow.name, stRow.arabic_name);
      return {
        id: stRow.id,
        name: stRow.name,
        arabicName: stRow.arabic_name || undefined,
        color: stRow.color || '#0E5C56',
        photoUrl: (stRow as any).photo_url || undefined,
        photoPosition: (stRow as any).photo_position || undefined,
        photoZoom: (stRow as any).photo_zoom || undefined,
        attendanceDays: Array.isArray(stRow.attendance_days) ? stRow.attendance_days : [1, 5],
        tilawaSurah: stRow.tilawa_surah || 1,
        tilawaAyah: stRow.tilawa_ayah || 1,
        memorizationFocus: (stRow as any).memorization_focus || (stRow as any).focus_notes || undefined,
        motivationalMessage: (stRow as any).motivational_message || undefined,
        surahRatings: stRow.surah_ratings || {},
        manualWeeklyStars: Array.isArray(stRow.manual_weekly_stars) ? stRow.manual_weekly_stars : [],
        entries: studentEntries,
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
          on_time_score: e.onTimeScore ?? null,
        });
      });
    });

    if (entriesToInsert.length > 0) {
      let { error: entriesErr } = await client
        .from('homework_entries')
        .upsert(entriesToInsert, { onConflict: 'id' });

      // If on_time_score column does not exist yet, fallback gracefully
      if (entriesErr && entriesErr.message?.includes('on_time_score')) {
        const strippedEntries = entriesToInsert.map(({ on_time_score, ...rest }) => rest);
        const retry = await client
          .from('homework_entries')
          .upsert(strippedEntries, { onConflict: 'id' });
        entriesErr = retry.error;
      }

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
 * Upload all current app data (families, students, and all homework entries) to Supabase.
 * Perfect for syncing all homework records of Ibrahim, Sulayman, Ali, Yusuf, Musab, etc. directly into Supabase tables!
 */
export async function syncAllLocalDataToSupabase(data: {
  families: Family[];
  students: Student[];
}): Promise<{ success: boolean; entriesCount: number; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, entriesCount: 0, message: 'Supabase is not configured' };
  }

  try {
    // 1. Upsert Families
    const familiesToInsert = data.families.map((f) => ({
      id: f.id,
      name: f.name,
      student_ids: f.studentIds,
      attendance_days: f.attendanceDays || [1, 5],
    }));

    if (familiesToInsert.length > 0) {
      const { error: famErr } = await client
        .from('families')
        .upsert(familiesToInsert, { onConflict: 'id' });

      if (famErr) {
        console.error('Error syncing families to Supabase:', famErr.message);
      }
    }

    // 2. Upsert Students
    const studentsToInsert = data.students.map((s) => ({
      id: s.id,
      name: s.name,
      arabic_name: s.arabicName || null,
      color: s.color,
      attendance_days: s.attendanceDays || [1, 5],
      tilawa_surah: s.tilawaSurah || 1,
      tilawa_ayah: s.tilawaAyah || 1,
      surah_ratings: s.surahRatings || {},
      manual_weekly_stars: s.manualWeeklyStars || [],
      photo_url: s.photoUrl || null,
      photo_position: s.photoPosition || null,
      photo_zoom: s.photoZoom || 1,
      memorization_focus: s.memorizationFocus || null,
      motivational_message: s.motivationalMessage || null,
    }));

    if (studentsToInsert.length > 0) {
      const { error: stErr } = await client
        .from('students')
        .upsert(studentsToInsert, { onConflict: 'id' });

      if (stErr) {
        console.error('Error syncing students to Supabase:', stErr.message);
      }
    }

    // 3. Upsert All Homework Entries across all students
    const entriesToInsert: SupabaseHomeworkRow[] = [];
    data.students.forEach((s) => {
      (s.entries || []).forEach((e) => {
        entriesToInsert.push({
          id: e.id,
          student_id: s.id,
          date: e.date,
          hifz_text: e.hifzText,
          hifz_grade: e.hifzGrade,
          murajaa_text: e.murajaaText,
          murajaa_grade: e.murajaaGrade,
          on_time_score: e.onTimeScore ?? null,
        });
      });
    });

    if (entriesToInsert.length > 0) {
      // Chunk upserts in batches of 500 to stay well under request size limits
      const batchSize = 500;
      for (let i = 0; i < entriesToInsert.length; i += batchSize) {
        const batch = entriesToInsert.slice(i, i + batchSize);
        let { error: entriesErr } = await client
          .from('homework_entries')
          .upsert(batch, { onConflict: 'id' });

        if (entriesErr && entriesErr.message?.includes('on_time_score')) {
          const strippedBatch = batch.map(({ on_time_score, ...rest }) => rest);
          const retry = await client
            .from('homework_entries')
            .upsert(strippedBatch, { onConflict: 'id' });
          entriesErr = retry.error;
        }

        if (entriesErr) {
          console.error('Error syncing entries batch to Supabase:', entriesErr.message);
          return {
            success: false,
            entriesCount: i,
            message: `فشل مزامنة الدفعة: ${entriesErr.message}`,
          };
        }
      }
    }

    return {
      success: true,
      entriesCount: entriesToInsert.length,
      message: `تم رفع وتحديث ${entriesToInsert.length} واجباً لجميع الطلاب في قاعدة البيانات بنجاح!`,
    };
  } catch (err: any) {
    console.error('Exception during syncAllLocalDataToSupabase:', err);
    return {
      success: false,
      entriesCount: 0,
      message: err?.message || 'حدث خطأ غير متوقع أثناء الرفع',
    };
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

    if (entry.onTimeScore !== undefined) {
      payload.on_time_score = entry.onTimeScore;
    }

    let { error } = await client
      .from('homework_entries')
      .upsert(payload, { onConflict: 'id' });

    // Fallback gracefully if database does not have on_time_score column
    if (error && error.message?.includes('on_time_score')) {
      delete payload.on_time_score;
      const retry = await client
        .from('homework_entries')
        .upsert(payload, { onConflict: 'id' });
      error = retry.error;
    }

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
 * Update a student's profile photo and frame positioning in Supabase
 */
export async function updateStudentPhotoInSupabase(
  studentId: string,
  photoUrl: string,
  photoPosition: string = '50% 20%',
  photoZoom: number = 1.0
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('students')
      .update({
        photo_url: photoUrl.trim() || null,
        photo_position: photoPosition,
        photo_zoom: photoZoom,
      })
      .eq('id', studentId);

    if (error) {
      console.warn('Supabase photo update notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updateStudentPhoto error:', err);
    return false;
  }
}

/**
 * Update student focus areas and recitation bookmark in Supabase
 */
export async function updateStudentFocusInSupabase(
  studentId: string,
  memorizationFocus: string,
  tilawaSurah?: number,
  tilawaAyah?: number,
  motivationalMessage?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const updatePayload: Record<string, any> = {
      memorization_focus: memorizationFocus.trim() || null,
    };
    if (typeof tilawaSurah === 'number') {
      updatePayload.tilawa_surah = tilawaSurah;
    }
    if (typeof tilawaAyah === 'number') {
      updatePayload.tilawa_ayah = tilawaAyah;
    }
    if (typeof motivationalMessage === 'string') {
      updatePayload.motivational_message = motivationalMessage.trim() || null;
    }

    const { error } = await client
      .from('students')
      .update(updatePayload)
      .eq('id', studentId);

    if (error) {
      console.warn('Supabase updateStudentFocus notice:', error.message);
      // Fallback update for basic fields if custom columns not added yet
      if (typeof tilawaSurah === 'number' && typeof tilawaAyah === 'number') {
        await client
          .from('students')
          .update({
            tilawa_surah: tilawaSurah,
            tilawa_ayah: tilawaAyah,
          })
          .eq('id', studentId);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updateStudentFocus error:', err);
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
