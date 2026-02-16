import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  const accessPassword = process.env.ACCESS_PASSWORD;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!accessPassword || !apiKey) {
    return res.status(500).json({ error: 'Server is not configured. Set ACCESS_PASSWORD and GEMINI_API_KEY in Vercel environment variables.' });
  }

  if (password !== accessPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  return res.status(200).json({ apiKey });
}
