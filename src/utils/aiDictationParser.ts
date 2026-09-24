import { QURAN_SURAHS, normalizeQuranHomeworkText } from '../data/quranSurahs';

export interface ParsedHomeworkResult {
  hifz: string;
  revision: string;
  grade?: string; // "E" | "VG" | "G" | "P" | "F" | "R" | "100" | "80" | "60" | "40" | "20"
  memorizationFocus?: string;
  tilawaSurah?: number | null;
  tilawaAyah?: number | null;
  summary?: string;
  source: 'gemini' | 'local_fallback';
}

/**
 * Convert eastern Arabic numerals (١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ٠) to Western numerals (1 2 3 4 5 6 7 8 9 0)
 */
export function normalizeNumerals(str: string): string {
  if (!str) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  return str
    .replace(/[٠-٩]/g, (w) => String(arabicNumerals.indexOf(w)))
    .replace(/[۰-۹]/g, (w) => String(persianNumerals.indexOf(w)));
}

/**
 * Normalizes common Arabic spelling variations (ة -> ه, أ إ آ -> ا, ى -> ي, etc.)
 */
function normalizeArabicText(str: string): string {
  return str
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip tashkeel
    .trim();
}

export async function checkGeminiStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/gemini-status');
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.configured);
    }
  } catch (e) {
    // ignore
  }
  return false;
}

/**
 * Sends dictated text to Gemini server endpoint, or falls back to robust local Quran parser.
 */
export async function parseDictatedHomework(
  text: string,
  studentName?: string
): Promise<ParsedHomeworkResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      hifz: '',
      revision: '',
      source: 'local_fallback',
    };
  }

  // 1. Try server-side Gemini AI parsing
  try {
    const res = await fetch('/api/parse-dictation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: trimmed,
        studentName: studentName || 'the student',
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Validate that hifz and revision are properly separated
        const hifzVal = (json.data.hifz || '').trim();
        const revVal = (json.data.revision || '').trim();

        // If Gemini erroneously put "المراجعة" inside "hifz", fix it with local splitter
        if (/(?:مراجعه|مراجعة|تثبيت|murajaa)/i.test(hifzVal) && !revVal) {
          return parseLocally(trimmed);
        }

        return {
          hifz: hifzVal,
          revision: revVal,
          grade: json.data.grade || undefined,
          memorizationFocus: json.data.memorizationFocus || undefined,
          tilawaSurah: typeof json.data.tilawaSurah === 'number' ? json.data.tilawaSurah : null,
          tilawaAyah: typeof json.data.tilawaAyah === 'number' ? json.data.tilawaAyah : null,
          summary: json.data.summary || '',
          source: 'gemini',
        };
      }
    } else {
      // Server returned 401, 500, or 503 (e.g. unconfigured or invalid key) -> fallback smoothly
      return parseLocally(trimmed);
    }
  } catch (err) {
    console.warn('AI server dictation endpoint failed, falling back to local parser:', err);
  }

  // 2. High-precision local fallback parser for Arabic & English Quran dictation
  return parseLocally(trimmed);
}

/**
 * Robust rule-based parser that handles all variations of:
 * - "الكهف من ١ الي ٥ والمراجعه سوره البقره من ٤ الي ٧"
 * - "واجب الحفظ سورة الكهف من 1 إلى 20، والمراجعة سورة مريم، التقييم ممتاز"
 * - Eastern & Western numerals
 * - Missing prefixes (e.g. starting directly with "الكهف 1 - 5")
 */
export function parseLocally(text: string): ParsedHomeworkResult {
  let hifz = '';
  let revision = '';
  let grade: string | undefined = undefined;
  let memorizationFocus: string | undefined = undefined;
  let tilawaSurah: number | null = null;
  let tilawaAyah: number | null = null;

  // 1. Standardize numerals and punctuation
  let normalized = normalizeNumerals(text);
  normalized = normalized
    .replace(/،/g, ',')
    .replace(/\r?\n/g, ' , ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Detect Grade (100, 80, 60, 40, 20 or descriptive words)
  if (/(ممتاز|امتياز|excellent|grade e|درجه ١٠٠|درجة 100|100%|١٠٠%)/i.test(normalized)) {
    grade = '100';
  } else if (/(جيد جدا|جيد جداً|very good|grade vg|درجه ٨٠|درجة 80|80%|٨٠%)/i.test(normalized)) {
    grade = '80';
  } else if (/(جيد\b|good|grade g|درجه ٦٠|درجة 60|60%|٦٠%)/i.test(normalized)) {
    grade = '60';
  } else if (/(مقبول|pass|passed|grade p|درجه ٤٠|درجة 40|40%|٤٠%)/i.test(normalized)) {
    grade = '40';
  } else if (/(ضعيف|needs work|fail|grade f|درجه ٢٠|درجة 20|20%|٢٠%)/i.test(normalized)) {
    grade = '20';
  } else if (/(اعادة|إعادة|repeat|grade r)/i.test(normalized)) {
    grade = '20';
  }

  // 3. Tilawa Bookmark detection
  // e.g. "تلاوة سورة الكهف اية 10", "سورة التلاوة الكهف 15", "ورد التلاوة البقرة"
  const tilawaRegex = /(?:تلاوة|التلاوة|تلاوه|التلاوه|قراءة|القراءة|قراءه|القراءه|ورد التلاوة|ورد التلاوه)\s+(?:سورة\s+|سوره\s+)?([^\d,،\.\n]+?)(?:\s*(?:اية|آية|ايه|آيه|رقم|صفحة|صفحه)?\s*(\d+))?(?:[,\.\n]|$)/i;
  const tilawaMatch = normalized.match(tilawaRegex);
  if (tilawaMatch) {
    const rawSurah = tilawaMatch[1]?.trim() || '';
    const rawAyah = tilawaMatch[2] ? parseInt(tilawaMatch[2], 10) : 1;
    const foundSurah = matchSurah(rawSurah);
    if (foundSurah) {
      tilawaSurah = foundSurah.number;
      tilawaAyah = rawAyah || 1;
    }
  }

  // 4. Focus Notes detection
  // e.g. "وركز على المتشابهات ومخارج الحروف", "تنبيه: أحكام المدود", "ملاحظات: حفظ متقن"
  const focusRegex = /(?:تركيز|التركيز|ركز|ملاحظات|الملاحظات|تنبيه|تنبيهات|توجيهات|focus|notes)\s*:?\s*(?:على|في)?\s*([^,،\n]+)/i;
  const focusMatch = normalized.match(focusRegex);
  if (focusMatch) {
    memorizationFocus = focusMatch[1].trim();
  }

  // 5. Clean helper text before separating Hifz & Revision
  // Remove grade phrases and focus phrases from the segment to avoid pollution
  let segment = normalized
    .replace(/(?:تقييم|التقييم|الدرجة|درجة|درجه|grade)\s*:?\s*[^,،]+/gi, ' ')
    .replace(/(?:تلاوة|التلاوة|تلاوه|التلاوه|قراءة|القراءة)\s+[^,،]+/gi, ' ')
    .replace(/(?:تركيز|التركيز|ركز|ملاحظات|الملاحظات|تنبيه|تنبيهات|توجيهات)\s*:?\s*(?:على|في)?\s*[^,،]+/gi, ' ')
    .trim();

  // 6. Split by Revision Keyword (والمراجعة, والمراجعه, مراجعة, مراجعه, تثبيت, murajaah, revision)
  // Matching phrases like:
  // "الكهف من 1 الي 5 والمراجعه سوره البقره من 4 الي 7"
  // "حفظ الكهف 1-10 مراجعة البقرة 1-20"
  const revisionSplitRegex = /(?:(?:و|\s|^)(?:المراجعة|المراجعه|مراجعة|مراجعه|التثبيت|تثبيت|المرجع|مرجع|revision|murajaah|review))\s*:?\s*(.+)$/i;
  const revMatch = segment.match(revisionSplitRegex);

  if (revMatch) {
    revision = cleanPortion(revMatch[1]);
    // The portion before the revision keyword is Hifz
    const beforeRev = segment.substring(0, revMatch.index).trim();
    hifz = cleanPortion(beforeRev);
  } else {
    // Check if explicitly has "حفظ" or "واجب الحفظ"
    const hifzExplicitRegex = /(?:واجب الحفظ|حفظ جديد|الحفظ|حفظ|new memorization|hifz)\s*:?\s*(.+)$/i;
    const hifzMatch = segment.match(hifzExplicitRegex);
    if (hifzMatch) {
      hifz = cleanPortion(hifzMatch[1]);
    } else {
      // Direct text like: "الكهف من 1 الي 5"
      hifz = cleanPortion(segment);
    }
  }

  // 7. Strip leading keywords from Hifz if any were retained
  hifz = hifz
    .replace(/^(?:واجب\s+الحفظ|حفظ\s+جديد|الحفظ|حفظ|new memorization|hifz)\s*:?\s*/i, '')
    .trim();

  // Strip leading keywords from Revision if any were retained
  revision = revision
    .replace(/^(?:المراجعة|المراجعه|مراجعة|مراجعه|التثبيت|تثبيت|revision|murajaah)\s*:?\s*/i, '')
    .trim();

  // Ensure "والمراجعه" or "المراجعة" hasn't leaked into hifz
  if (/(?:مراجعه|مراجعة|تثبيت)/i.test(hifz)) {
    const parts = hifz.split(/(?:و?المراجعة|و?المراجعه|و?تثبيت)/i);
    if (parts.length >= 2) {
      hifz = cleanPortion(parts[0]);
      if (!revision) {
        revision = cleanPortion(parts.slice(1).join(' '));
      }
    }
  }

  // 8. Format cleanly with canonical Quran Surah names if available
  if (hifz) {
    hifz = formatPortionText(hifz);
  }
  if (revision) {
    revision = formatPortionText(revision);
  }

  // If both are empty but text contains surah, deduce
  if (!hifz && !revision) {
    for (const surah of QURAN_SURAHS) {
      const normInput = normalizeArabicText(normalized);
      const normSurah = normalizeArabicText(surah.arabicName);
      if (normInput.includes(normSurah)) {
        hifz = surah.arabicName;
        break;
      }
    }
  }

  return {
    hifz,
    revision,
    grade,
    memorizationFocus,
    tilawaSurah,
    tilawaAyah,
    summary: hifz ? `الحفظ: ${hifz} | المراجعة: ${revision || '—'}` : 'تم استخراج البيانات',
    source: 'local_fallback',
  };
}

function matchSurah(raw: string) {
  const clean = normalizeArabicText(
    raw
      .trim()
      .replace(/^(?:سورة|سوره)\s+/, '')
      .replace(/^surah\s+/i, '')
      .trim()
  );

  return QURAN_SURAHS.find((s) => {
    const normSurah = normalizeArabicText(s.arabicName);
    return (
      clean.includes(normSurah) ||
      normSurah.includes(clean) ||
      clean.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(clean.toLowerCase())
    );
  });
}

/**
 * Cleans and formats a portion string:
 * - "من ١ الي ٥" -> "1 - 5"
 * - "سوره البقره" -> "البقرة"
 * - "من ٤ الي ٧" -> "4 - 7"
 */
function cleanPortion(raw: string): string {
  if (!raw) return '';
  let text = normalizeNumerals(raw.trim());

  // Remove leading punctuations and conjunctions
  text = text.replace(/^[:\-\–,\.\s]+/, '');
  text = text.replace(/^(?:و|ثم)\s+/, '');

  // Normalize "من X الى Y" or "من X لـ Y" or "من X ل Y" or "X الى Y" to "X - Y"
  text = text.replace(/(?:من\s+)?(\d+)\s*(?:الى|إلى|الي|لـ|ل|حتى|حتي|-)\s*(\d+)/gi, '$1 - $2');

  // Normalize "كاملة" or "كامل"
  text = text.replace(/\b(كامله|كاملة|كامل)\b/gi, 'كاملة');

  // Normalize "سوره" -> "سورة" (or remove prefix for cleaner table display)
  text = text.replace(/\b(?:سوره|سورة)\s+/gi, '');

  // Clean trailing commas, dots, dashes
  text = text.replace(/[,;،\.\-]+$/, '').trim();
  return text;
}

/**
 * Replaces variations like "الكهف من 1 الي 5" with "الكهف 1 - 5" or "البقره 4 - 7" with "البقرة 4 - 7"
 */
function formatPortionText(portion: string): string {
  let cleaned = portion
    .replace(/(?:من\s+)?(\d+)\s*(?:الي|إلى|الى|لـ|ل)\s*(\d+)/gi, '$1 - $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Fix common surah names spelling (e.g. "البقره" -> "البقرة", "يسن" -> "يس")
  for (const s of QURAN_SURAHS) {
    const normClean = normalizeArabicText(cleaned);
    const normSurah = normalizeArabicText(s.arabicName);
    if (normClean.includes(normSurah)) {
      // Replace non-canonical spelling with standard s.arabicName
      const regex = new RegExp(`\\b(?:سورة\\s+|سوره\\s+)?${normSurah}[هة]?\\b`, 'i');
      cleaned = cleaned.replace(regex, s.arabicName);
    }
  }

  return cleaned;
}
