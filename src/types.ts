export type GradeValue = 100 | 80 | 60 | 40 | 20;

export type SurahMemorizationStatus =
  | 'not_memorized'
  | 'in_progress'
  | 'strong'
  | 'medium'
  | 'weak'
  | 'forgot';

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  hifzText: string;
  hifzGrade: GradeValue | null;
  murajaaText: string;
  murajaaGrade: GradeValue | null;
  onTimeScore?: number | null; // Evaluation for lesson entry punctuality (60-100)
}

export interface ManualWeeklyStars {
  weekEndDate: string; // YYYY-MM-DD (the Friday that ends the week)
  stars: number; // 0 to 5
}

export interface Student {
  id: string;
  name: string;
  arabicName?: string;
  color: string; // hex, used as avatar/accent
  photoUrl?: string;
  entries: Entry[];
  manualWeeklyStars?: ManualWeeklyStars[];
  surahRatings?: Record<number, SurahMemorizationStatus>; // Surah number (1-114) -> status
  attendanceDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] where 0=Sun, 1=Mon, ..., 6=Sat
  tilawaSurah?: number; // Surah number (1-114) for current Tilawa
  tilawaAyah?: number; // Current Ayah number within the selected Surah
}

export interface Family {
  id: string;
  name: string;
  studentIds: string[];
  attendanceDays?: number[]; // Default attendance days for the family
}

export type TimeRange = 'week' | 'month' | 'year';

export interface WeekRange {
  startDate: string; // Saturday YYYY-MM-DD
  endDate: string; // Friday YYYY-MM-DD
  starRevealDate: Date; // Saturday 2:00 AM after endDate
}

