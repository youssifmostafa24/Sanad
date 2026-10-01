import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { Family, Student, Entry, SurahMemorizationStatus, ManualWeeklyStars, GradeValue } from '../types';
import { getInitialData } from '../data/seedData';
import { normalizeQuranHomeworkText, QURAN_SURAHS } from '../data/quranSurahs';

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

export interface SupabaseStudentSurahTrackerRow {
  id?: string;
  student_id: string;
  surah_number: number;
  surah_name?: string | null;
  status: SurahMemorizationStatus;
  updated_at?: string;
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
  parent_password_hash?: string | null;
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

    // If tables are empty in database, return empty data (do not auto-seed mock data)
    if ((!familiesData || familiesData.length === 0) && (!studentsData || studentsData.length === 0)) {
      return { families: [], students: [] };
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

    // 4. Fetch Surah tracker records from student_surah_tracker table (if present)
    const surahTrackerByStudent: Record<string, Record<number, SurahMemorizationStatus>> = {};
    try {
      const { data: trackerRows, error: trackerErr } = await client
        .from('student_surah_tracker')
        .select('*');

      if (!trackerErr && trackerRows && trackerRows.length > 0) {
        trackerRows.forEach((row: any) => {
          const stId = row.student_id;
          if (!surahTrackerByStudent[stId]) {
            surahTrackerByStudent[stId] = {};
          }
          if (row.surah_number && row.status) {
            surahTrackerByStudent[stId][row.surah_number] = row.status as SurahMemorizationStatus;
          }
        });
      }
    } catch (e) {
      // Table may not exist yet or not yet migrated
      console.warn('Note: student_surah_tracker query notice:', e);
    }

    // 5. Fetch Weekly Stars and Motivational Messages from student_weekly_stars table (if present)
    const weeklyStarsByStudent: Record<string, ManualWeeklyStars[]> = {};
    try {
      const { data: starRows, error: starErr } = await client
        .from('student_weekly_stars')
        .select('*');

      if (!starErr && starRows && starRows.length > 0) {
        starRows.forEach((row: any) => {
          const stId = row.student_id;
          if (!weeklyStarsByStudent[stId]) {
            weeklyStarsByStudent[stId] = [];
          }
          weeklyStarsByStudent[stId].push({
            weekEndDate: row.week_end_date,
            stars: typeof row.stars === 'number' ? row.stars : parseFloat(row.stars) || 5,
            disabledAuto: Boolean(row.disabled_auto),
            title: row.title || undefined,
            message: row.message || undefined,
          });
        });
      }
    } catch (e) {
      console.warn('Note: student_weekly_stars query notice:', e);
    }

    // Helper to find matching entries for a student whether student_id matches exact ID or student name/slug
    const getEntriesForStudent = (stId: string, stName: string, stArabicName?: string | null): Entry[] => {
      let rawEntries: Entry[] = [];

      // 1. Direct match on stId
      if (entriesByStudentId[stId] && entriesByStudentId[stId].length > 0) {
        rawEntries = entriesByStudentId[stId];
      } else {
        // 2. Try normalized slug matches (e.g. 'musab' <-> 'student-musab', 'ali' <-> 'student-ali')
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
            rawEntries = entries;
            break;
          }
        }
      }

      // Crucial Deduplication: Ensure each date has exactly ONE entry per student
      // If duplicates exist for the same date, prefer the newer/active entry
      const uniqueByDateMap = new Map<string, Entry>();
      for (const entry of rawEntries) {
        if (!uniqueByDateMap.has(entry.date)) {
          uniqueByDateMap.set(entry.date, entry);
        } else {
          // If already exists for this date, pick the one with more information or newer id
          const existing = uniqueByDateMap.get(entry.date)!;
          const isCurrentBetter =
            (entry.hifzGrade !== null && existing.hifzGrade === null) ||
            (entry.murajaaGrade !== null && existing.murajaaGrade === null) ||
            (entry.id.startsWith('entry-') && !existing.id.startsWith('entry-'));
          if (isCurrentBetter) {
            uniqueByDateMap.set(entry.date, entry);
          }
        }
      }

      return Array.from(uniqueByDateMap.values()).sort((a, b) => b.date.localeCompare(a.date));
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
        surahRatings: {
          ...(stRow.surah_ratings || {}),
          ...(surahTrackerByStudent[stRow.id] || {}),
        },
        manualWeeklyStars: (() => {
          const fromStudentRow: ManualWeeklyStars[] = Array.isArray(stRow.manual_weekly_stars) ? stRow.manual_weekly_stars : [];
          const fromTrackerTable: ManualWeeklyStars[] = weeklyStarsByStudent[stRow.id] || [];
          const combinedMap = new Map<string, ManualWeeklyStars>();
          fromStudentRow.forEach((m) => combinedMap.set(m.weekEndDate, m));
          fromTrackerTable.forEach((m) => combinedMap.set(m.weekEndDate, m));
          return Array.from(combinedMap.values());
        })(),
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
        parentPasswordHash: fRow.parent_password_hash || undefined,
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
      parent_password_hash: f.parentPasswordHash || null,
    }));

    if (familiesToInsert.length > 0) {
      let { error: famErr } = await client
        .from('families')
        .upsert(familiesToInsert, { onConflict: 'id' });

      // Fallback gracefully if database does not yet have parent_password_hash column
      if (famErr && famErr.message?.includes('parent_password_hash')) {
        const strippedFamilies = familiesToInsert.map(({ parent_password_hash, ...rest }) => rest);
        const retry = await client
          .from('families')
          .upsert(strippedFamilies, { onConflict: 'id' });
        famErr = retry.error;
      }

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
        const standardId = `entry-${s.id.toLowerCase().replace(/^student-/, '')}-${e.date.trim()}`;
        entriesToInsert.push({
          id: standardId,
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
    const studentSlug = studentId.toLowerCase().trim().replace(/^student-/, '');
    const standardId = `entry-${studentSlug}-${entry.date.trim()}`;

    const payload: SupabaseHomeworkRow = {
      id: standardId,
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
 * Update a student's Surah memorization ratings in Supabase
 * Synchronizes with both students.surah_ratings and public.student_surah_tracker
 */
export async function updateStudentSurahRatingsInSupabase(
  studentId: string,
  surahRatings: Record<number, SurahMemorizationStatus>,
  updatedSurahNumber?: number,
  updatedStatus?: SurahMemorizationStatus
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Update in students table (JSONB column)
    const { error: studentUpdateError } = await client
      .from('students')
      .update({ surah_ratings: surahRatings })
      .eq('id', studentId);

    if (studentUpdateError) {
      console.warn('Supabase update surah ratings error in students table:', studentUpdateError.message);
    }

    // 2. Upsert into dedicated student_surah_tracker table
    try {
      if (typeof updatedSurahNumber === 'number' && updatedStatus) {
        const surahInfo = QURAN_SURAHS.find((s) => s.number === updatedSurahNumber);
        const { error: trackerSingleError } = await client
          .from('student_surah_tracker')
          .upsert(
            {
              student_id: studentId,
              surah_number: updatedSurahNumber,
              surah_name: surahInfo?.name || `Surah ${updatedSurahNumber}`,
              status: updatedStatus,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'student_id,surah_number' }
          );

        if (trackerSingleError) {
          console.warn('Supabase student_surah_tracker single upsert notice:', trackerSingleError.message);
        }
      } else {
        const trackerRows = Object.entries(surahRatings).map(([surahNumStr, status]) => {
          const num = parseInt(surahNumStr, 10);
          const surahInfo = QURAN_SURAHS.find((s) => s.number === num);
          return {
            student_id: studentId,
            surah_number: num,
            surah_name: surahInfo?.name || `Surah ${num}`,
            status,
            updated_at: new Date().toISOString(),
          };
        });

        if (trackerRows.length > 0) {
          const { error: trackerBatchError } = await client
            .from('student_surah_tracker')
            .upsert(trackerRows, { onConflict: 'student_id,surah_number' });

          if (trackerBatchError) {
            console.warn('Supabase student_surah_tracker batch upsert notice:', trackerBatchError.message);
          }
        }
      }
    } catch (trackerErr) {
      console.warn('Note: student_surah_tracker sync notice:', trackerErr);
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
 * Update family parent password hash in Supabase
 */
export async function updateFamilyParentPasswordInSupabase(
  familyId: string,
  parentPasswordHash?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('families')
      .update({ parent_password_hash: parentPasswordHash || null })
      .eq('id', familyId);

    if (error) {
      console.warn('Supabase update family parent password hash error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error updating family parent password hash in Supabase:', err);
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
 * Save and persist Weekly Star evaluation, title, and motivational message to Supabase
 * Synchronizes with both public.students (JSONB & columns) and public.student_weekly_stars table
 */
export async function saveWeeklyStarSettingsInSupabase(
  studentId: string,
  weekEndDate: string,
  settings: {
    message: string;
    title: string;
    manualStars?: number;
    disableAuto: boolean;
  },
  allManualWeeklyStars: ManualWeeklyStars[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Update students table (JSONB column manual_weekly_stars + motivational_message)
    try {
      await client
        .from('students')
        .update({
          manual_weekly_stars: allManualWeeklyStars,
          motivational_message: settings.message ? settings.message.trim() : null,
        })
        .eq('id', studentId);
    } catch (err) {
      console.warn('Supabase update manual_weekly_stars in students table notice:', err);
    }

    // 2. Upsert into dedicated student_weekly_stars table
    try {
      const { error: starTableError } = await client
        .from('student_weekly_stars')
        .upsert(
          {
            student_id: studentId,
            week_end_date: weekEndDate,
            stars: typeof settings.manualStars === 'number' ? settings.manualStars : 5,
            disabled_auto: settings.disableAuto,
            title: settings.title ? settings.title.trim() : null,
            message: settings.message ? settings.message.trim() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'student_id,week_end_date' }
        );

      if (starTableError) {
        console.warn('Supabase student_weekly_stars table upsert notice:', starTableError.message);
      }
    } catch (starTableErr) {
      console.warn('Supabase student_weekly_stars table notice:', starTableErr);
    }

    return true;
  } catch (err) {
    console.error('Error saving weekly star settings to Supabase:', err);
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_surah_tracker' },
        () => onDataChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_weekly_stars' },
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
