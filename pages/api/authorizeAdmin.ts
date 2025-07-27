import type { NextApiRequest, NextApiResponse } from 'next';
import { authorizeAdmin } from '../../src/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password } = req.body;
  try {
    const ok = await authorizeAdmin(username, password);
    res.status(200).json({ ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
