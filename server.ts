import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Endpoint to check if GEMINI_API_KEY is configured on server
  app.get('/api/gemini-status', (_req, res) => {
    const key = process.env.GEMINI_API_KEY?.trim();
    const hasKey = Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
    return res.json({ configured: hasKey });
  });

  // API endpoint: Parse homework and focus notes from dictation or transcript
  app.post('/api/parse-dictation', async (req, res) => {
    try {
      const { text, studentName } = req.body;

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text transcript is required' });
      }

      // In AI Studio Server-Side Gemini API, apiKey can be passed, or automatically discovered
      // Validate that apiKey is not empty or dummy placeholder
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      const isPlaceholder = !apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === '';
      if (isPlaceholder) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server',
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
        // In case there are markdown code fences
        const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Gemini parse-dictation error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to parse dictation with AI',
        fallbackNeeded: true,
      });
    }
  });

  // Serve static files in production or mount Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
