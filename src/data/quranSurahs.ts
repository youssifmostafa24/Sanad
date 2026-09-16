import { SurahMemorizationStatus } from '../types';

export interface QuranSurah {
  number: number;
  name: string;
  arabicName: string;
  ayahCount: number;
}

export interface SurahStatusMeta {
  value: SurahMemorizationStatus;
  label: string;
  shortLabel: string;
  bgColor: string;
  textColor: string;
}

export const SURAH_STATUS_OPTIONS: SurahStatusMeta[] = [
  {
    value: 'not_memorized',
    label: 'Not Memorized',
    shortLabel: 'Not Memorized',
    bgColor: '#808080',
    textColor: '#FFFFFF',
  },
  {
    value: 'in_progress',
    label: 'New Memorization (In progress)',
    shortLabel: 'In progress',
    bgColor: '#E033F5',
    textColor: '#FFFFFF',
  },
  {
    value: 'strong',
    label: 'Memorized and reviewed (strong)',
    shortLabel: 'strong',
    bgColor: '#23953F',
    textColor: '#FFFFFF',
  },
  {
    value: 'medium',
    label: 'Memorized and reviewed (medium)',
    shortLabel: 'medium',
    bgColor: '#FA8400',
    textColor: '#FFFFFF',
  },
  {
    value: 'weak',
    label: 'Memorized and reviewed (weak)',
    shortLabel: 'weak',
    bgColor: '#DE382F',
    textColor: '#FFFFFF',
  },
  {
    value: 'forgot',
    label: 'Memorized - Forgot - Review Again',
    shortLabel: 'Forgot',
    bgColor: '#2B72D4',
    textColor: '#FFFFFF',
  },
];

export function getSurahStatusMeta(status?: SurahMemorizationStatus | string | null): SurahStatusMeta {
  return (
    SURAH_STATUS_OPTIONS.find((s) => s.value === status) || SURAH_STATUS_OPTIONS[0]
  );
}

export const QURAN_SURAHS: QuranSurah[] = [
  { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', ayahCount: 7 },
  { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', ayahCount: 286 },
  { number: 3, name: "Ali 'Imran", arabicName: 'آل عمران', ayahCount: 200 },
  { number: 4, name: "An-Nisa'", arabicName: 'النساء', ayahCount: 176 },
  { number: 5, name: "Al-Ma'idah", arabicName: 'المائدة', ayahCount: 120 },
  { number: 6, name: "Al-An'am", arabicName: 'الأنعام', ayahCount: 165 },
  { number: 7, name: "Al-A'raf", arabicName: 'الأعراف', ayahCount: 206 },
  { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', ayahCount: 75 },
  { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', ayahCount: 129 },
  { number: 10, name: 'Yunus', arabicName: 'يونس', ayahCount: 109 },
  { number: 11, name: 'Hud', arabicName: 'هود', ayahCount: 123 },
  { number: 12, name: 'Yusuf', arabicName: 'يوسف', ayahCount: 111 },
  { number: 13, name: "Ar-Ra'd", arabicName: 'الرعد', ayahCount: 43 },
  { number: 14, name: 'Ibrahim', arabicName: 'إبراهيم', ayahCount: 52 },
  { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', ayahCount: 99 },
  { number: 16, name: 'An-Nahl', arabicName: 'النحل', ayahCount: 128 },
  { number: 17, name: "Al-Isra'", arabicName: 'الإسراء', ayahCount: 111 },
  { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', ayahCount: 110 },
  { number: 19, name: 'Maryam', arabicName: 'مريم', ayahCount: 98 },
  { number: 20, name: 'Taha', arabicName: 'طه', ayahCount: 135 },
  { number: 21, name: "Al-Anbiya'", arabicName: 'الأنبياء', ayahCount: 112 },
  { number: 22, name: 'Al-Hajj', arabicName: 'الحج', ayahCount: 78 },
  { number: 23, name: "Al-Mu'minun", arabicName: 'المؤمنون', ayahCount: 118 },
  { number: 24, name: 'An-Nur', arabicName: 'النور', ayahCount: 64 },
  { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', ayahCount: 77 },
  { number: 26, name: "Ash-Shu'ara'", arabicName: 'الشعراء', ayahCount: 227 },
  { number: 27, name: 'An-Naml', arabicName: 'النمل', ayahCount: 93 },
  { number: 28, name: 'Al-Qasas', arabicName: 'القصص', ayahCount: 88 },
  { number: 29, name: "Al-'Ankabut", arabicName: 'العنكبوت', ayahCount: 69 },
  { number: 30, name: 'Ar-Rum', arabicName: 'الروم', ayahCount: 60 },
  { number: 31, name: 'Luqman', arabicName: 'لقمان', ayahCount: 34 },
  { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', ayahCount: 30 },
  { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', ayahCount: 73 },
  { number: 34, name: "Saba'", arabicName: 'سبأ', ayahCount: 54 },
  { number: 35, name: 'Fatir', arabicName: 'فاطر', ayahCount: 45 },
  { number: 36, name: 'Ya-Sin', arabicName: 'يس', ayahCount: 83 },
  { number: 37, name: 'As-Saffat', arabicName: 'الصافات', ayahCount: 182 },
  { number: 38, name: 'Sad', arabicName: 'ص', ayahCount: 88 },
  { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', ayahCount: 75 },
  { number: 40, name: 'Ghafir', arabicName: 'غافر', ayahCount: 85 },
  { number: 41, name: 'Fussilat', arabicName: 'فصلت', ayahCount: 54 },
  { number: 42, name: 'Ash-Shura', arabicName: 'الشورى', ayahCount: 53 },
  { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', ayahCount: 89 },
  { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', ayahCount: 59 },
  { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', ayahCount: 37 },
  { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', ayahCount: 35 },
  { number: 47, name: 'Muhammad', arabicName: 'محمد', ayahCount: 38 },
  { number: 48, name: 'Al-Fath', arabicName: 'الفتح', ayahCount: 29 },
  { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', ayahCount: 18 },
  { number: 50, name: 'Qaf', arabicName: 'ق', ayahCount: 45 },
  { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', ayahCount: 60 },
  { number: 52, name: 'At-Tur', arabicName: 'الطور', ayahCount: 49 },
  { number: 53, name: 'An-Najm', arabicName: 'النجم', ayahCount: 62 },
  { number: 54, name: 'Al-Qamar', arabicName: 'القمر', ayahCount: 55 },
  { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', ayahCount: 78 },
  { number: 56, name: "Al-Waqi'ah", arabicName: 'الواقعة', ayahCount: 96 },
  { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', ayahCount: 29 },
  { number: 58, name: 'Al-Mujadila', arabicName: 'المجادلة', ayahCount: 22 },
  { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', ayahCount: 24 },
  { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', ayahCount: 13 },
  { number: 61, name: 'As-Saff', arabicName: 'الصف', ayahCount: 14 },
  { number: 62, name: "Al-Jumu'ah", arabicName: 'الجمعة', ayahCount: 11 },
  { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', ayahCount: 11 },
  { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', ayahCount: 18 },
  { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', ayahCount: 12 },
  { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', ayahCount: 12 },
  { number: 67, name: 'Al-Mulk', arabicName: 'الملك', ayahCount: 30 },
  { number: 68, name: 'Al-Qalam', arabicName: 'القلم', ayahCount: 52 },
  { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', ayahCount: 52 },
  { number: 70, name: "Al-Ma'arij", arabicName: 'المعارج', ayahCount: 44 },
  { number: 71, name: 'Nuh', arabicName: 'نوح', ayahCount: 28 },
  { number: 72, name: 'Al-Jinn', arabicName: 'الجن', ayahCount: 28 },
  { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', ayahCount: 20 },
  { number: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', ayahCount: 56 },
  { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', ayahCount: 40 },
  { number: 76, name: 'Al-Insan', arabicName: 'الإنسان', ayahCount: 31 },
  { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', ayahCount: 50 },
  { number: 78, name: 'An-Naba', arabicName: 'النبأ', ayahCount: 40 },
  { number: 79, name: "An-Nazi'at", arabicName: 'النازعات', ayahCount: 46 },
  { number: 80, name: "'Abasa", arabicName: 'عبس', ayahCount: 42 },
  { number: 81, name: 'At-Takwir', arabicName: 'التكوير', ayahCount: 29 },
  { number: 82, name: 'Al-Infitar', arabicName: 'الانفطار', ayahCount: 19 },
  { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', ayahCount: 36 },
  { number: 84, name: 'Al-Inshiqaq', arabicName: 'الانشقاق', ayahCount: 25 },
  { number: 85, name: 'Al-Buruj', arabicName: 'البروج', ayahCount: 22 },
  { number: 86, name: 'At-Tariq', arabicName: 'الطارق', ayahCount: 17 },
  { number: 87, name: "Al-A'la", arabicName: 'الأعلى', ayahCount: 19 },
  { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', ayahCount: 26 },
  { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', ayahCount: 30 },
  { number: 90, name: 'Al-Balad', arabicName: 'البلد', ayahCount: 20 },
  { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', ayahCount: 15 },
  { number: 92, name: 'Al-Layl', arabicName: 'الليل', ayahCount: 21 },
  { number: 93, name: 'Ad-Duha', arabicName: 'الضحى', ayahCount: 11 },
  { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', ayahCount: 8 },
  { number: 95, name: 'At-Tin', arabicName: 'التين', ayahCount: 8 },
  { number: 96, name: "Al-'Alaq", arabicName: 'العلق', ayahCount: 19 },
  { number: 97, name: 'Al-Qadr', arabicName: 'القدر', ayahCount: 5 },
  { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', ayahCount: 8 },
  { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', ayahCount: 8 },
  { number: 100, name: "Al-'Adiyat", arabicName: 'العاديات', ayahCount: 11 },
  { number: 101, name: "Al-Qari'ah", arabicName: 'القارعة', ayahCount: 11 },
  { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', ayahCount: 8 },
  { number: 103, name: "Al-'Asr", arabicName: 'العصر', ayahCount: 3 },
  { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', ayahCount: 9 },
  { number: 105, name: 'Al-Fil', arabicName: 'الفيل', ayahCount: 5 },
  { number: 106, name: 'Quraysh', arabicName: 'قريش', ayahCount: 4 },
  { number: 107, name: "Al-Ma'un", arabicName: 'الماعون', ayahCount: 7 },
  { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', ayahCount: 3 },
  { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', ayahCount: 6 },
  { number: 110, name: 'An-Nasr', arabicName: 'النصر', ayahCount: 3 },
  { number: 111, name: 'Al-Masad', arabicName: 'المسد', ayahCount: 5 },
  { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', ayahCount: 4 },
  { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', ayahCount: 5 },
  { number: 114, name: 'An-Nas', arabicName: 'الناس', ayahCount: 6 },
];

/**
 * Format homework text according to the required specification:
 * e.g., مريم 35–1
 * When fromAyah is 1 and toAyah reaches the end of the Surah, it writes "end-1":
 * e.g., مريم end-1
 * Parentheses are removed to save horizontal space while keeping the dash between numbers.
 */
export function formatQuranHomework(
  surahArabicName: string,
  fromAyah: number,
  toAyah: number,
  surahTotalAyahs?: number
): string {
  // Find surah total ayahs if not provided
  let total = surahTotalAyahs;
  if (!total) {
    const rawClean = surahArabicName.replace(/^(سورة\s*)/, '').replace(/[()]/g, '').trim().toLowerCase();
    const found = QURAN_SURAHS.find(
      (s) =>
        s.arabicName === surahArabicName ||
        s.arabicName.replace(/^(سورة\s*)/, '') === surahArabicName ||
        s.arabicName.toLowerCase() === rawClean ||
        s.name.toLowerCase() === rawClean
    );
    if (found) {
      total = found.ayahCount;
    }
  }

  const cleanSurah = surahArabicName.replace(/[\u200E\u200F]/g, '').replace(/[()]/g, '').trim();

  // When fromAyah is 1 and toAyah is the end of the Surah: write "end-1"
  if (fromAyah === 1 && total && toAyah >= total) {
    return `${cleanSurah} end-1`;
  }

  if (fromAyah === toAyah) {
    return `${cleanSurah} ${fromAyah}`;
  }
  const minAyah = Math.min(fromAyah, toAyah);
  const maxAyah = Math.max(fromAyah, toAyah);
  return `${cleanSurah} ${maxAyah}–${minAyah}`;
}

/**
 * Parse an existing homework string back to Surah and Ayah range
 * Supports both numeric ranges with/without parentheses e.g. "مريم 35–1", "مريم ( 35–1 )"
 * and "end-1" / "1-end"
 */
export function parseQuranHomework(text: string): {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
} | null {
  if (!text) return null;
  const clean = text.replace(/[\u200E\u200F]/g, '').trim();

  // 1. Check for end-1 or 1-end or end ⬅ 1 format
  let rawName: string | null = null;
  const prefixMatch = clean.match(/^\(?\s*(?:[1١]\s*[-–—⬅←]\s*end|end\s*[-–—⬅←]\s*[1١])\s*\)?\s*(.+)$/i);
  if (prefixMatch) {
    rawName = prefixMatch[1].replace(/[()]/g, '').trim();
  } else {
    const endMatch = clean.match(/^(.+?)(?:\s*\(?\s*|\s+)(?:[1١]\s*[-–—⬅←]\s*end|end\s*[-–—⬅←]\s*[1١])\s*\)?$/i);
    if (endMatch) {
      rawName = endMatch[1].replace(/[()]/g, '').trim();
    }
  }

  if (rawName) {
    const rawNameClean = rawName.replace(/^(سورة\s*)/, '').replace(/[()]/g, '').trim().toLowerCase();
    const found = QURAN_SURAHS.find(
      (s) =>
        s.arabicName === rawName ||
        s.arabicName.replace(/^(سورة\s*)/, '') === rawNameClean ||
        s.arabicName.toLowerCase() === rawNameClean ||
        s.name.toLowerCase() === rawNameClean
    );
    if (found) {
      return {
        surahNumber: found.number,
        fromAyah: 1,
        toAyah: found.ayahCount,
      };
    }
  }

  // 2. Numeric format: matches both with and without parentheses, Surah first or range first
  // Examples: "مريم 98–60", "مريم 98 ⬅ 60", "( 98-60 ) مريم", "98-60 مريم", "مريم 35", "مريم ( 35 )"
  let numRawName = '';
  let raw1 = 1;
  let raw2 = 1;

  // Case A: Surah first, then range/ayah
  const matchA = clean.match(/^([^\d()]+?)\s*(?:\(\s*)?(\d+)(?:\s*[-–—⬅←]\s*(\d+))?(?:\s*\))?$/);
  // Case B: Range/ayah first, then Surah
  const matchB = clean.match(/^(?:\(\s*)?(\d+)(?:\s*[-–—⬅←]\s*(\d+))?(?:\s*\))?\s*([^\d()]+)$/);

  if (matchA) {
    numRawName = matchA[1].replace(/[()]/g, '').trim();
    raw1 = parseInt(matchA[2], 10) || 1;
    raw2 = matchA[3] ? parseInt(matchA[3], 10) : raw1;
  } else if (matchB) {
    numRawName = matchB[3].replace(/[()]/g, '').trim();
    raw1 = parseInt(matchB[1], 10) || 1;
    raw2 = matchB[2] ? parseInt(matchB[2], 10) : raw1;
  } else {
    return null;
  }

  const rawNameClean = numRawName.replace(/^(سورة\s*)/, '').trim().toLowerCase();

  const found = QURAN_SURAHS.find(
    (s) =>
      s.arabicName === numRawName ||
      s.arabicName.replace(/^(سورة\s*)/, '') === numRawName ||
      s.arabicName.toLowerCase() === rawNameClean ||
      s.name.toLowerCase() === rawNameClean
  );

  if (!found) return null;

  const from = Math.min(raw1, raw2);
  const to = Math.max(raw1, raw2);

  return {
    surahNumber: found.number,
    fromAyah: Math.min(Math.max(1, from), found.ayahCount),
    toAyah: Math.min(Math.max(from, to), found.ayahCount),
  };
}

/**
 * Normalizes any homework text so that:
 * - Parentheses are removed to save horizontal space
 * - A dash is preserved between numbers (or end-1)
 * - Full-surah homework (from 1 to last ayah) displays "end-1"
 * - Swaps smaller and larger number so larger number is displayed in place of the smaller number.
 */
export function normalizeQuranHomeworkText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const clean = text.replace(/[\u200E\u200F]/g, '').trim();
  const parsed = parseQuranHomework(clean);
  if (!parsed) {
    // If not directly parsed as a Quran surah, strip parentheses surrounding numbers
    return clean.replace(/\(\s*([0-9١-٩endEND]+(?:\s*[-–]\s*[0-9١-٩endEND]+)?)\s*\)/g, '$1').replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  }

  const surah = QURAN_SURAHS.find((s) => s.number === parsed.surahNumber);
  if (!surah) return clean.replace(/[()]/g, '').trim();

  if (parsed.fromAyah === 1 && parsed.toAyah >= surah.ayahCount) {
    return `${surah.arabicName} end-1`;
  }

  const minAyah = Math.min(parsed.fromAyah, parsed.toAyah);
  const maxAyah = Math.max(parsed.fromAyah, parsed.toAyah);
  if (minAyah === maxAyah) {
    return `${surah.arabicName} ${minAyah}`;
  }
  return `${surah.arabicName} ${maxAyah}–${minAyah}`;
}

export interface ParsedHomeworkDisplay {
  surahName: string;
  ayahRange: string;
}

/**
 * Extracts the surah name and ayah range for bulletproof visual rendering:
 * - Ayah range on the left (in the direction of the date card) without parentheses
 * - Surah name to the right of the ayah range
 * - Keeps dash between numbers (or end-1) without parentheses
 * - Larger number first, then dash, then smaller number
 */
export function parseHomeworkDisplay(text: string): ParsedHomeworkDisplay | null {
  if (!text || typeof text !== 'string') return null;
  const clean = text.replace(/[\u200E\u200F]/g, '').trim();
  if (!clean) return null;

  // Helper to reorder numeric range: swap small and big numbers, strictly without parentheses
  const formatRangePart = (rawPart: string): string => {
    let p = rawPart.replace(/[()]/g, '').trim();
    if (/^[1١]\s*[-–—⬅←]\s*end$/i.test(p) || /^end\s*[-–—⬅←]\s*[1١]$/i.test(p)) {
      return 'end-1';
    }
    const numMatch = p.match(/^([0-9]+)\s*[-–—⬅←]\s*([0-9]+)$/);
    if (numMatch) {
      const n1 = parseInt(numMatch[1], 10);
      const n2 = parseInt(numMatch[2], 10);
      if (n1 !== n2) {
        const min = Math.min(n1, n2);
        const max = Math.max(n1, n2);
        return `${max}–${min}`;
      }
    }
    return p;
  };

  // Case 1: Surah followed by ( range ) e.g. "الكهف ( 10–1 )" or "الكهف ( 10 ⬅ 1 )"
  const m1 = clean.match(/^([^\d()]+?)\s*\(\s*(.+?)\s*\)$/);
  if (m1) {
    const part1 = m1[1].replace(/[()]/g, '').trim();
    let part2 = m1[2].trim();
    if (/^[0-9١-٩]+(?:\s*[-–—⬅←]\s*(?:[0-9١-٩]+|end))?$/i.test(part2) || /end/i.test(part2)) {
      part2 = formatRangePart(part2);
      return { surahName: part1, ayahRange: part2 };
    }
  }

  // Case 2: ( range ) followed by Surah e.g. "( 10–1 ) الكهف" or "( 10 ⬅ 1 ) الكهف"
  const m2 = clean.match(/^\(\s*(.+?)\s*\)\s*([^\d()]+)$/);
  if (m2) {
    let part1 = m2[1].trim();
    const part2 = m2[2].replace(/[()]/g, '').trim();
    if (/^[0-9١-٩]+(?:\s*[-–—⬅←]\s*(?:[0-9١-٩]+|end))?$/i.test(part1) || /end/i.test(part1)) {
      part1 = formatRangePart(part1);
      return { surahName: part2, ayahRange: part1 };
    }
  }

  // Case 3: Surah followed by numbers without parentheses e.g. "الكهف 10–1", "الكهف 10 ⬅ 1", "الكهف end-1"
  const m3 = clean.match(/^([^\d()]+?)\s+([0-9١-٩]+(?:\s*[-–—⬅←]\s*(?:[0-9١-٩]+|end))?|end(?:[-–—⬅←][0-9١-٩]+)?)$/i);
  if (m3) {
    const part1 = m3[1].replace(/[()]/g, '').trim();
    const part2 = formatRangePart(m3[2].trim());
    return { surahName: part1, ayahRange: part2 };
  }

  // Case 4: Numbers followed by Surah without parentheses e.g. "10–1 الكهف", "10 ⬅ 1 الكهف", "end ⬅ 1 الكهف"
  const m4 = clean.match(/^([0-9١-٩]+(?:\s*[-–—⬅←]\s*(?:[0-9١-٩]+|end))?|end(?:[-–—⬅←][0-9١-٩]+)?)\s+([^\d()]+)$/i);
  if (m4) {
    const part1 = formatRangePart(m4[1].trim());
    const part2 = m4[2].replace(/[()]/g, '').trim();
    return { surahName: part2, ayahRange: part1 };
  }

  // Case 5: Standalone number range or end-1 without surah e.g. "51-110", "110 ⬅ 51", "end ⬅ 1"
  const m5 = clean.match(/^([0-9١-٩]+(?:\s*[-–—⬅←]\s*(?:[0-9١-٩]+|end))?|end(?:[-–—⬅←][0-9١-٩]+)?)$/i);
  if (m5) {
    return { surahName: '', ayahRange: formatRangePart(m5[1].trim()) };
  }

  return null;
}

/**
 * Resolves the Quran surah from a homework string or surah title.
 * Accurately matches arabic names, english names, or parsed homework numbers.
 */
export function getSurahFromHomework(text: string): QuranSurah | undefined {
  if (!text || typeof text !== 'string') return undefined;
  const clean = text.replace(/[\u200E\u200F]/g, '').trim();
  if (!clean) return undefined;

  // 1. Try parsing full homework format (e.g. "الحديد 3-9", "الكهف end-1", etc.)
  const parsed = parseQuranHomework(clean);
  if (parsed) {
    const found = QURAN_SURAHS.find((s) => s.number === parsed.surahNumber);
    if (found) return found;
  }

  // 2. Try parsing display parts (e.g. { surahName, ayahRange })
  const parsedDisplay = parseHomeworkDisplay(clean);
  const nameToMatch = (parsedDisplay?.surahName || clean).replace(/[()]/g, '').trim();

  // 3. Match against QURAN_SURAHS (longest name first)
  const cleanName = nameToMatch.replace(/^(سورة\s*)/, '').trim().toLowerCase();
  const sorted = [...QURAN_SURAHS].sort((a, b) => b.arabicName.length - a.arabicName.length);

  return sorted.find((s) => {
    const sAr = s.arabicName.replace(/^(سورة\s*)/, '').trim().toLowerCase();
    const sEn = s.name.toLowerCase();
    return (
      s.arabicName === nameToMatch ||
      sAr === cleanName ||
      nameToMatch.includes(s.arabicName) ||
      cleanName.includes(sAr) ||
      clean.includes(s.arabicName) ||
      sEn === cleanName
    );
  });
}
