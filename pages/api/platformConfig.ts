import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlatformConfig, setPlatformConfig } from '../../src/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const config = await getPlatformConfig();
      res.status(200).json(config);
    } catch (e) {
      res.status(500).json({ error: 'Ошибка получения настроек' });
    }
  } else if (req.method === 'POST') {
    try {
      const config = req.body;
      await setPlatformConfig(config);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Ошибка сохранения настроек' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
