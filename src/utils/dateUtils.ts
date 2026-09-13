import { Entry, GradeValue, ManualWeeklyStars } from '../types';

/**
 * Formats a Date to YYYY-MM-DD using local calendar date (avoids UTC timezone shift).
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Returns weekday short name e.g. "Tue", "Wed"
 */
export function getWeekdayShort(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Returns day-of-month e.g. "11", "2"
 */
export function getDayOfMonth(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return String(date.getDate());
}

/**
 * Returns formatted month + year e.g. "September 2026"
 */
export function getMonthYearLabel(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Finds the Saturday (start of week) and Thursday (end of week) for a given date.
 * Per request: Week starts on Saturday and ends on Thursday.
 */
export function getWeekBounds(date: Date): {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  thursdayStr: string;
  saturdayStr: string;
} {
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  // Saturday has day 6 -> (6 + 1) % 7 = 0 days since Saturday
  // Sunday has day 0 -> (0 + 1) % 7 = 1 day since Saturday
  // Friday has day 5 -> (5 + 1) % 7 = 6 days since Saturday
  const daysSinceSaturday = (day + 1) % 7;

  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceSaturday, 0, 0, 0);
  // End of study week is Thursday (Saturday + 5 days)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 5, 23, 59, 59);

  const startStr = formatLocalDate(start);
  const endStr = formatLocalDate(end);

  return {
    start,
    end,
    startStr,
    endStr,
    thursdayStr: endStr,
    saturdayStr: startStr,
  };
}

/**
 * Returns the week end Thursday for any given date string.
 */
export function getWeekEndThursday(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const { endStr } = getWeekBounds(date);
  return endStr;
}

/**
 * Legacy compatibility alias for getWeekEndThursday.
 */
export function getWeekEndFriday(dateStr: string): string {
  return getWeekEndThursday(dateStr);
}

/**
 * Formats a Saturday-to-Thursday week span in Arabic.
 * e.g., "السبت 29 أغسطس - الخميس 3 سبتمبر 2026"
 */
export function formatWeekArabic(startStr: string, endStr: string): string {
  const startDate = parseLocalDate(startStr);
  const endDate = parseLocalDate(endStr);
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const monthsArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const startMonth = monthsArabic[startDate.getMonth()];
  const endMonth = monthsArabic[endDate.getMonth()];
  const year = endDate.getFullYear();

  if (startDate.getMonth() === endDate.getMonth()) {
    return `السبت ${startDay} - الخميس ${endDay} ${endMonth} ${year}`;
  }
  return `السبت ${startDay} ${startMonth} - الخميس ${endDay} ${endMonth} ${year}`;
}

/**
 * Formats a Saturday-to-Thursday week span in English.
 * e.g., "Sat, Aug 29 – Thu, Sep 3, 2026"
 */
export function formatWeekEnglish(startStr: string, endStr: string): string {
  const startDate = parseLocalDate(startStr);
  const endDate = parseLocalDate(endStr);
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const year = endDate.getFullYear();

  if (startDate.getMonth() === endDate.getMonth()) {
    return `Sat, ${startMonth} ${startDate.getDate()} – Thu, ${endDate.getDate()}, ${year}`;
  }
  return `Sat, ${startMonth} ${startDate.getDate()} – Thu, ${endMonth} ${endDate.getDate()}, ${year}`;
}

/**
 * Determines whether a week's rating is visible.
 * Becomes visible once Thursday has passed (or if in review).
 */
export function isWeekRatingVisible(weekEndDateStr: string, now: Date = new Date()): boolean {
  const todayStr = formatLocalDate(now);
  return todayStr >= weekEndDateStr;
}

/**
 * Calculates star rating from grade percentage:
 * - 0%  -> 1.0 star
 * - 10% -> 1.5 stars
 * - 20% -> 2.0 stars
 * - 30% -> 2.5 stars
 * - 40% -> 3.0 stars
 * - 50% -> 3.5 stars
 * - 60% -> 4.0 stars
 * - 70% -> 4.5 stars
 * - 80%, 90%, 100% -> 5.0 stars
 */
export function calculateStarsFromPercentage(percentage: number): number {
  if (percentage >= 80) {
    return 5;
  }
  if (percentage <= 0) {
    return 1;
  }
  const step = Math.round(percentage / 10);
  const stars = 1 + step * 0.5;
  return Math.max(1, Math.min(5, stars));
}

/**
 * Calculates or retrieves the weekly star count (0 to 5) for a student for a specific week ending on Thursday.
 * Returns null if no rating is available.
 */
export function getWeeklyStarRating(
  weekEndDateStr: string,
  entries: Entry[],
  manualWeeklyStars?: ManualWeeklyStars[],
  now: Date = new Date()
): { stars: number; isManual: boolean } | null {
  // If student has manual weekly stars matching this week's end or Friday
  if (manualWeeklyStars && manualWeeklyStars.length > 0) {
    const manual = manualWeeklyStars.find(
      (m) => m.weekEndDate === weekEndDateStr || m.weekEndDate === addDays(weekEndDateStr, 1)
    );
    if (manual) {
      return { stars: Math.max(0, Math.min(5, manual.stars)), isManual: true };
    }
  }

  // Week runs Saturday to Thursday. Start date (Saturday) is 5 days before weekEndDateStr (Thursday)
  const saturdayStr = addDays(weekEndDateStr, -5);
  // Also include Friday (6 days after Saturday) just in case an entry was created on Friday
  const weekCutoffStr = addDays(saturdayStr, 6);

  // Collect all grades in this week
  const weekEntries = entries.filter((e) => e.date >= saturdayStr && e.date <= weekCutoffStr);
  const grades: GradeValue[] = [];

  for (const entry of weekEntries) {
    if (entry.hifzGrade !== null && entry.hifzGrade !== undefined) {
      grades.push(entry.hifzGrade);
    }
    if (entry.murajaaGrade !== null && entry.murajaaGrade !== undefined) {
      grades.push(entry.murajaaGrade);
    }
  }

  if (grades.length === 0) {
    return null;
  }

  const average = grades.reduce((acc, curr) => acc + curr, 0) / grades.length;
  const stars = calculateStarsFromPercentage(average);
  return { stars: Math.max(0, Math.min(5, stars)), isManual: false };
}

/**
 * Date arithmetic helper: adds N days to YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * Calculates the next attendance date based on the student/family attendance days schedule.
 * attendanceDays is an array of day numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
 * e.g. [1, 5] for Mon and Fri.
 */
export function getNextAttendanceDate(
  lastDateStr: string,
  attendanceDays?: number[]
): string {
  // If no attendance days specified, default to next day
  if (!attendanceDays || attendanceDays.length === 0) {
    return addDays(lastDateStr, 1);
  }

  // Start checking from the day after lastDateStr
  let candidate = addDays(lastDateStr, 1);
  for (let i = 0; i < 7; i++) {
    const d = parseLocalDate(candidate);
    const dayOfWeek = d.getDay();
    if (attendanceDays.includes(dayOfWeek)) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }

  return addDays(lastDateStr, 1);
}

