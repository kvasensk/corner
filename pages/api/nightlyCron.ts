import { NextApiRequest, NextApiResponse } from 'next';

let isRunning = false;
let nextCallTimeout: NodeJS.Timeout | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[${new Date().toISOString()}] NightlyCron called:`, req.method);

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'start') {
      if (isRunning) {
        return res.status(200).json({ message: 'NightlyCron already running' });
      }

      isRunning = true;
      console.log('Starting nightly cron...');

      // Планируем следующий вызов
      scheduleNextCall();

      return res
        .status(200)
        .json({ message: 'NightlyCron started successfully' });
    }

    if (action === 'stop') {
      isRunning = false;
      if (nextCallTimeout) {
        clearTimeout(nextCallTimeout);
        nextCallTimeout = null;
      }
      console.log('Stopping nightly cron...');
      return res
        .status(200)
        .json({ message: 'NightlyCron stopped successfully' });
    }

    if (action === 'status') {
      return res.status(200).json({
        isRunning,
        hasTimeout: !!nextCallTimeout,
      });
    }
  }

  // GET запрос - просто статус
  return res.status(200).json({
    isRunning,
    hasTimeout: !!nextCallTimeout,
    message: 'NightlyCron endpoint. Use POST with action: start/stop/status',
  });
}

function scheduleNextCall() {
  if (!isRunning) return;

  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(1, 30, 0, 0); // 1:30 AM

  // Если уже прошло 1:30 сегодня, планируем на завтра
  if (now.getTime() > targetTime.getTime()) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const timeUntilNext = targetTime.getTime() - now.getTime();

  console.log(
    `[${new Date().toISOString()}] NightlyCron: Next cleanup scheduled for ${targetTime.toISOString()} (${Math.round(
      timeUntilNext / 60000
    )} minutes from now)`
  );

  nextCallTimeout = setTimeout(async () => {
    if (isRunning) {
      console.log('NightlyCron: Executing cleanup...');

      try {
        // Вызываем очистку
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/nightlyCleanup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('NightlyCron: Cleanup completed:', result);
        } else {
          console.error('NightlyCron: Cleanup failed:', response.status);
        }
      } catch (error) {
        console.error('NightlyCron: Error during cleanup:', error);
      }

      // Планируем следующий вызов (через 24 часа)
      scheduleNextCall();
    }
  }, timeUntilNext);
}
