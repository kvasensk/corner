import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vercel автоматически защищает cron endpoints, поэтому проверка авторизации не нужна

  try {
    console.log('Cron job started');
    // Вызываем основной endpoint для продвижения очереди
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/advanceQueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Queue advancement failed: ${response.status}`);
    }

    const result = await response.json();

    return res.status(200).json({
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
