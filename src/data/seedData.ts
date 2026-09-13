import { Family, Student, GradeValue } from '../types';
import { formatLocalDate, addDays, getWeekBounds } from '../utils/dateUtils';
import { normalizeQuranHomeworkText } from './quranSurahs';

export const GRADE_OPTIONS: { value: GradeValue | null; label: string; icon: string; percent: string }[] = [
  { value: null, label: '—', icon: '', percent: 'Pending' },
  { value: 100, label: '✅✅', icon: '✅✅', percent: 'Full' },
  { value: 80, label: '✅', icon: '✅', percent: 'Good' },
  { value: 60, label: '🟨', icon: '🟨', percent: 'Review' },
  { value: 40, label: '❌', icon: '❌', percent: 'Needs work' },
  { value: 20, label: '❌❌', icon: '❌❌', percent: 'Repeat' },
];

/**
 * Generates initial seed data dynamically anchored around the current local calendar date.
 */
export function getInitialData(): { families: Family[]; students: Student[] } {
  const today = new Date();
  const todayStr = formatLocalDate(today);
  const yesterdayStr = addDays(todayStr, -1);
  const twoDaysAgoStr = addDays(todayStr, -2);
  const threeDaysAgoStr = addDays(todayStr, -3);

  // Past week dates for historical stars demo
  const currentWeek = getWeekBounds(today);
  // Last week's Friday is 1 day before current week's Saturday
  const lastWeekFridayStr = addDays(currentWeek.startStr, -1);
  const lastWeekThursdayStr = addDays(lastWeekFridayStr, -1);
  const lastWeekWednesdayStr = addDays(lastWeekFridayStr, -2);
  const lastWeekTuesdayStr = addDays(lastWeekFridayStr, -3);
  const lastWeekMondayStr = addDays(lastWeekFridayStr, -4);

  // Archive dates (older than previous week)
  const archiveDate1 = addDays(currentWeek.startStr, -10);
  const archiveDate2 = addDays(currentWeek.startStr, -15);
  const archiveDate3 = addDays(currentWeek.startStr, -18);

  const students: Student[] = [
    {
      id: 'student-ibrahim',
      name: 'Ibrahim',
      arabicName: 'إبراهيم',
      color: '#0E5C56', // deep teal
      attendanceDays: [1, 5], // Monday & Friday
      tilawaSurah: 18, // Al-Kahf
      tilawaAyah: 45,
      entries: [
        {
          id: 'ibr-entry-1',
          date: todayStr,
          hifzText: "الكهف ( 1–10 )",
          hifzGrade: null, // Ungraded -> Needs grading next session!
          murajaaText: "مريم ( 1–35 )",
          murajaaGrade: null,
        },
        {
          id: 'ibr-entry-2',
          date: yesterdayStr,
          hifzText: "الإسراء ( 105–111 )",
          hifzGrade: 100,
          murajaaText: "يس ( 1–40 )",
          murajaaGrade: 80,
        },
        {
          id: 'ibr-entry-3',
          date: twoDaysAgoStr,
          hifzText: "الإسراء ( 90–104 )",
          hifzGrade: 80,
          murajaaText: "مريم ( 1–35 )",
          murajaaGrade: 100,
        },
        {
          id: 'ibr-entry-4',
          date: threeDaysAgoStr,
          hifzText: "الإسراء ( 75–89 )",
          hifzGrade: 100,
          murajaaText: "الكهف ( 50–75 )",
          murajaaGrade: 80,
        },
        // Past week entries to showcase completed weekly star rating
        // Note: lastWeekMondayStr may belong to the previous calendar month,
        // and is transferred to the current month view so the whole week is evaluated together!
        {
          id: 'ibr-entry-prev-1',
          date: lastWeekThursdayStr,
          hifzText: "الإسراء ( 50–74 )",
          hifzGrade: 100,
          murajaaText: "الملك ( 1–30 )",
          murajaaGrade: 100,
        },
        {
          id: 'ibr-entry-prev-2',
          date: lastWeekWednesdayStr,
          hifzText: "الإسراء ( 25–49 )",
          hifzGrade: 80,
          murajaaText: "الإنسان ( 1–31 )",
          murajaaGrade: 80,
        },
        {
          id: 'ibr-entry-prev-3',
          date: lastWeekTuesdayStr,
          hifzText: "الإسراء ( 1–24 )",
          hifzGrade: 100,
          murajaaText: "النبأ ( 1–40 )",
          murajaaGrade: 100,
        },
        {
          id: 'ibr-entry-prev-4',
          date: lastWeekMondayStr,
          hifzText: "النحل ( 111–128 )",
          hifzGrade: 100,
          murajaaText: "المرسلات ( 1–50 )",
          murajaaGrade: 100,
        },
        // Archived entries (from earlier weeks)
        {
          id: 'ibr-entry-arch-1',
          date: archiveDate1,
          hifzText: "النحل ( 110–128 )",
          hifzGrade: 100,
          murajaaText: "إبراهيم ( 1–25 )",
          murajaaGrade: 80,
        },
        {
          id: 'ibr-entry-arch-2',
          date: archiveDate2,
          hifzText: "النحل ( 90–109 )",
          hifzGrade: 80,
          murajaaText: "الرعد ( 1–20 )",
          murajaaGrade: 100,
        },
      ],
    },
    {
      id: 'student-sulayman',
      name: 'Sulaymn',
      arabicName: 'سليمان',
      color: '#B8860B', // gold
      attendanceDays: [6, 1, 3], // Saturday, Monday, Wednesday
      tilawaSurah: 19, // Maryam
      tilawaAyah: 20,
      entries: [
        {
          id: 'sul-entry-1',
          date: todayStr,
          hifzText: "مريم ( 50–65 )",
          hifzGrade: null, // Ungraded -> Needs grading next session!
          murajaaText: "طه ( 1–45 )",
          murajaaGrade: 80,
        },
        {
          id: 'sul-entry-2',
          date: yesterdayStr,
          hifzText: "مريم ( 30–49 )",
          hifzGrade: 80,
          murajaaText: "يوسف ( 50–75 )",
          murajaaGrade: 60,
        },
        {
          id: 'sul-entry-3',
          date: twoDaysAgoStr,
          hifzText: "مريم ( 1–29 )",
          hifzGrade: 100,
          murajaaText: "يوسف ( 1–49 )",
          murajaaGrade: 80,
        },
        {
          id: 'sul-entry-prev-1',
          date: lastWeekThursdayStr,
          hifzText: "يوسف ( 85–111 )",
          hifzGrade: 80,
          murajaaText: "هود ( 60–90 )",
          murajaaGrade: 80,
        },
        {
          id: 'sul-entry-prev-2',
          date: lastWeekWednesdayStr,
          hifzText: "يوسف ( 60–84 )",
          hifzGrade: 100,
          murajaaText: "هود ( 1–59 )",
          murajaaGrade: 80,
        },
        // Archived entries for Sulayman
        {
          id: 'sul-entry-arch-1',
          date: archiveDate1,
          hifzText: "يوسف ( 30–59 )",
          hifzGrade: 80,
          murajaaText: "يونس ( 50–75 )",
          murajaaGrade: 100,
        },
        {
          id: 'sul-entry-arch-2',
          date: archiveDate2,
          hifzText: "يوسف ( 1–29 )",
          hifzGrade: 100,
          murajaaText: "يونس ( 1–49 )",
          murajaaGrade: 80,
        },
      ],
    },
    {
      id: 'student-ali',
      name: 'Ali',
      arabicName: 'علي',
      color: '#2D6A4F', // forest green
      attendanceDays: [0, 2, 4], // Sunday, Tuesday, Thursday
      tilawaSurah: 16, // An-Nahl
      tilawaAyah: 70,
      entries: [
        {
          id: 'ali-entry-1',
          date: todayStr,
          hifzText: "البلد ( 1–20 )",
          hifzGrade: null, // Ungraded
          murajaaText: "الشمس ( 1–15 )",
          murajaaGrade: null,
        },
        {
          id: 'ali-entry-2',
          date: yesterdayStr,
          hifzText: "الفجر ( 1–30 )",
          hifzGrade: 100,
          murajaaText: "الغاشية ( 1–26 )",
          murajaaGrade: 100,
        },
        {
          id: 'ali-entry-3',
          date: twoDaysAgoStr,
          hifzText: "الغاشية ( 1–26 )",
          hifzGrade: 100,
          murajaaText: "الطارق ( 1–17 )",
          murajaaGrade: 80,
        },
        {
          id: 'ali-entry-prev-1',
          date: lastWeekWednesdayStr,
          hifzText: "الأعلى ( 1–19 )",
          hifzGrade: 100,
          murajaaText: "النبأ ( 1–40 )",
          murajaaGrade: 100,
        },
        // Archived entries for Ali
        {
          id: 'ali-entry-arch-1',
          date: archiveDate1,
          hifzText: "الطارق ( 1–17 )",
          hifzGrade: 100,
          murajaaText: "المطففين ( 1–36 )",
          murajaaGrade: 80,
        },
        {
          id: 'ali-entry-arch-2',
          date: archiveDate2,
          hifzText: "البروج ( 1–22 )",
          hifzGrade: 80,
          murajaaText: "النازعات ( 1–46 )",
          murajaaGrade: 100,
        },
      ],
    },
    {
      id: 'student-musab',
      name: 'Musab',
      arabicName: 'مصعب',
      color: '#1D4ED8', // deep blue
      attendanceDays: [1, 5], // Monday & Friday
      tilawaSurah: 20, // Taha
      tilawaAyah: 15,
      entries: [
        {
          id: 'musab-entry-1',
          date: todayStr,
          hifzText: "الحديد ( 1–10 )",
          hifzGrade: null,
          murajaaText: "الواقعة ( 1–40 )",
          murajaaGrade: null,
        },
        {
          id: 'musab-entry-2',
          date: yesterdayStr,
          hifzText: "الواقعة ( 70–96 )",
          hifzGrade: 100,
          murajaaText: "الرحمن ( 1–35 )",
          murajaaGrade: 80,
        },
        {
          id: 'musab-entry-3',
          date: twoDaysAgoStr,
          hifzText: "الواقعة ( 35–69 )",
          hifzGrade: 80,
          murajaaText: "ق ( 1–45 )",
          murajaaGrade: 100,
        },
        {
          id: 'musab-entry-prev-1',
          date: lastWeekThursdayStr,
          hifzText: "الواقعة ( 1–34 )",
          hifzGrade: 100,
          murajaaText: "الذاريات ( 1–60 )",
          murajaaGrade: 100,
        },
      ],
    },
    {
      id: 'student-umair',
      name: 'Umair',
      arabicName: 'عمير',
      color: '#C2410C', // orange/amber
      attendanceDays: [0, 3], // Sunday & Wednesday
      tilawaSurah: 21, // Al-Anbiya
      tilawaAyah: 1,
      entries: [
        {
          id: 'umair-entry-1',
          date: todayStr,
          hifzText: "الملك ( 1–15 )",
          hifzGrade: null,
          murajaaText: "القلم ( 1–30 )",
          murajaaGrade: null,
        },
        {
          id: 'umair-entry-2',
          date: yesterdayStr,
          hifzText: "الحاقة ( 1–25 )",
          hifzGrade: 100,
          murajaaText: "المعارج ( 1–44 )",
          murajaaGrade: 100,
        },
        {
          id: 'umair-entry-3',
          date: twoDaysAgoStr,
          hifzText: "المعارج ( 1–30 )",
          hifzGrade: 80,
          murajaaText: "نوح ( 1–28 )",
          murajaaGrade: 80,
        },
        {
          id: 'umair-entry-prev-1',
          date: lastWeekWednesdayStr,
          hifzText: "نوح ( 1–28 )",
          hifzGrade: 100,
          murajaaText: "الجن ( 1–28 )",
          murajaaGrade: 100,
        },
      ],
    },
    {
      id: 'student-uthman',
      name: 'Uthman',
      arabicName: 'عثمان',
      color: '#4F46E5', // indigo
      attendanceDays: [6, 2], // Saturday & Tuesday
      tilawaSurah: 36, // Ya-Sin
      tilawaAyah: 12,
      entries: [
        {
          id: 'uthman-entry-1',
          date: todayStr,
          hifzText: "النبأ ( 1–20 )",
          hifzGrade: null,
          murajaaText: "النازعات ( 1–25 )",
          murajaaGrade: null,
        },
        {
          id: 'uthman-entry-2',
          date: yesterdayStr,
          hifzText: "عبس ( 1–20 )",
          hifzGrade: 100,
          murajaaText: "التكوير ( 1–29 )",
          murajaaGrade: 100,
        },
        {
          id: 'uthman-entry-3',
          date: twoDaysAgoStr,
          hifzText: "الانفطار ( 1–19 )",
          hifzGrade: 100,
          murajaaText: "المطففين ( 1–20 )",
          murajaaGrade: 80,
        },
        {
          id: 'uthman-entry-prev-1',
          date: lastWeekWednesdayStr,
          hifzText: "المطففين ( 1–36 )",
          hifzGrade: 100,
          murajaaText: "الانشقاق ( 1–25 )",
          murajaaGrade: 100,
        },
      ],
    },
    {
      id: 'student-yusuf',
      name: 'Yusuf',
      arabicName: 'يوسف',
      color: '#059669', // emerald green
      attendanceDays: [1, 4], // Monday & Thursday
      tilawaSurah: 12, // Yusuf
      tilawaAyah: 30,
      entries: [
        {
          id: 'yusuf-entry-1',
          date: todayStr,
          hifzText: "طه ( 1–25 )",
          hifzGrade: null,
          murajaaText: "مريم ( 1–50 )",
          murajaaGrade: null,
        },
        {
          id: 'yusuf-entry-2',
          date: yesterdayStr,
          hifzText: "مريم ( 60–98 )",
          hifzGrade: 100,
          murajaaText: "الكهف ( 1–50 )",
          murajaaGrade: 80,
        },
        {
          id: 'yusuf-entry-3',
          date: twoDaysAgoStr,
          hifzText: "مريم ( 30–59 )",
          hifzGrade: 80,
          murajaaText: "الإسراء ( 1–50 )",
          murajaaGrade: 100,
        },
        {
          id: 'yusuf-entry-prev-1',
          date: lastWeekThursdayStr,
          hifzText: "مريم ( 1–29 )",
          hifzGrade: 100,
          murajaaText: "الكهف ( 51–110 )",
          murajaaGrade: 100,
        },
      ],
    },
    {
      id: 'student-hayaa',
      name: 'Hayaa',
      arabicName: 'حياء',
      color: '#DB2777', // rose
      attendanceDays: [0, 2, 5], // Sunday, Tuesday, Friday
      tilawaSurah: 67, // Al-Mulk
      tilawaAyah: 1,
      entries: [
        {
          id: 'hayaa-entry-1',
          date: todayStr,
          hifzText: "يس ( 1–20 )",
          hifzGrade: null,
          murajaaText: "الصافات ( 1–30 )",
          murajaaGrade: null,
        },
        {
          id: 'hayaa-entry-2',
          date: yesterdayStr,
          hifzText: "فاطر ( 1–20 )",
          hifzGrade: 100,
          murajaaText: "سبأ ( 1–30 )",
          murajaaGrade: 100,
        },
        {
          id: 'hayaa-entry-3',
          date: twoDaysAgoStr,
          hifzText: "سبأ ( 1–25 )",
          hifzGrade: 100,
          murajaaText: "الأحزاب ( 1–30 )",
          murajaaGrade: 80,
        },
        {
          id: 'hayaa-entry-prev-1',
          date: lastWeekWednesdayStr,
          hifzText: "الأحزاب ( 1–25 )",
          hifzGrade: 100,
          murajaaText: "السجدة ( 1–30 )",
          murajaaGrade: 100,
        },
      ],
    },
  ];

  const families: Family[] = [
    {
      id: 'family-1',
      name: 'Sulaymn + Ibrahim + Ali',
      studentIds: ['student-sulayman', 'student-ibrahim', 'student-ali'],
    },
    {
      id: 'family-2',
      name: 'Musab + umair + Uthman',
      studentIds: ['student-musab', 'student-umair', 'student-uthman'],
    },
    {
      id: 'family-3',
      name: 'Yusuf + Hayaa',
      studentIds: ['student-yusuf', 'student-hayaa'],
    },
  ];

  // Ensure all full-surah entries automatically follow the "1-end" convention
  const normalizedStudents = students.map((st) => ({
    ...st,
    entries: st.entries.map((e) => ({
      ...e,
      hifzText: normalizeQuranHomeworkText(e.hifzText),
      murajaaText: normalizeQuranHomeworkText(e.murajaaText),
    })),
  }));

  return { families, students: normalizedStudents };
}
