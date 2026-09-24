import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.GEMINI_API_KEY?.trim();
  const hasKey = Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
  return res.status(200).json({ configured: hasKey });
}
