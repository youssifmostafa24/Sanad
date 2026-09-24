import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, studentName } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text transcript is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const isPlaceholder = !apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '';
    if (isPlaceholder) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables',
        fallbackNeeded: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an expert Quran teacher assistant. Analyze the teacher's voice transcript or dictated notes for student "${studentName || 'the student'}" and extract the structured Quran homework and guidance.

TRANSCRIPT:
"""
${text.trim()}
"""

CRITICAL EXTRACTION RULES:
1. SEPARATE "hifz" (New Memorization / الحفظ الجديد) from "revision" (Murajaah / المراجعة والتثبيت).
   - "hifz": MUST contain ONLY the new memorization surah and verse numbers (e.g. "الكهف 1 - 5"). NEVER put the word "المراجعة" or the revision surah inside "hifz".
   - "revision": MUST contain ONLY the revision surah and verse numbers (e.g. "البقرة 4 - 7").
   - Convert Arabic numerals (١, ٢, ٣, ...) to standard numerals (1, 2, 3, ...).
   - Convert "من 1 الي 5" or "من 1 إلى 5" into "1 - 5".
2. "grade": If mentioned, return the grade string (e.g. "100" or "E" for ممتاز, "80" or "VG" for جيد جداً, "60" or "G" for جيد, "40" or "P" for مقبول, "20" or "F" for ضعيف). If not mentioned, return "".
3. "memorizationFocus": Key points or tajweed/notes student needs to focus on. If not mentioned, return "".
4. "tilawaSurah": The Quran surah number (1-114) for recitation/tilawa if mentioned, or null.
5. "tilawaAyah": The Quran ayah number for recitation if mentioned, or null.
6. "summary": A brief one-sentence friendly summary in Arabic.

Example:
If input is: "الكهف من ١ الي ٥ والمراجعه سوره البقره من ٤ الي ٧"
Output:
{
  "hifz": "الكهف 1 - 5",
  "revision": "البقرة 4 - 7",
  "grade": "",
  "memorizationFocus": "",
  "tilawaSurah": null,
  "tilawaAyah": null,
  "summary": "واجب الحفظ: الكهف 1 - 5 والمراجعة: البقرة 4 - 7"
}

Extract and return ONLY a valid JSON object matching this schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('Vercel Gemini parse-dictation error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to parse dictation with AI',
      fallbackNeeded: true,
    });
  }
}
