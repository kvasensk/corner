import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Вызов /api/nightlyCleanup (можно через fetch)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/nightlyCleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      const result = await response.json();
      return res.status(200).json({ message: 'Nightly cleanup done', result });
    } else {
      return res
        .status(500)
        .json({ error: 'Nightly cleanup failed', status: response.status });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' });
  }
}
