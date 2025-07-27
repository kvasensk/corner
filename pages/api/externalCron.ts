import { NextApiRequest, NextApiResponse } from 'next';
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import type { QueueEntry } from '../../src/types/queue';
import type { PlatformConfig } from '../../src/lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Проверяем секретный ключ для безопасности
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.EXTERNAL_CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log(
      `[${new Date().toISOString()}] External cron: Queue advancement started`
    );

    // Получаем настройки платформы
    const configDoc = await getDoc(doc(db, 'config', 'platform'));
    const platformConfig = configDoc.exists()
      ? (configDoc.data() as PlatformConfig)
      : null;

    // Проверяем ручной режим
    if (platformConfig?.manualQueue) {
      console.log(
        `[${new Date().toISOString()}] External cron: Manual queue mode - no advancement`
      );
      return res
        .status(200)
        .json({ message: 'Manual queue mode - no auto advancement' });
    }

    // Получаем актуальную очередь из базы
    const q = await getDocs(query(collection(db, 'queue'), orderBy('time')));
    const allEntries = q.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as QueueEntry[];

    const duration = (platformConfig?.gameDuration || 25) * 60 * 1000;
    const currentTime = Date.now();

    console.log(
      `[${new Date().toISOString()}] External cron: Processing ${
        allEntries.length
      } entries`
    );

    // Продвигаем очередь до тех пор, пока не найдем активного игрока
    let shouldContinue = true;
    let iterations = 0;
    const maxIterations = 10;
    let changesMade = 0;

    while (shouldContinue && iterations < maxIterations) {
      iterations++;

      const playing = allEntries.find(q => q.status === 'playing');
      const waiting = allEntries
        .filter(q => q.status === 'waiting')
        .sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );

      // Если нет играющего, но есть ожидающие
      if (!playing && waiting.length > 0) {
        const next = waiting[0];
        await updateDoc(doc(db, 'queue', next.id), {
          status: 'playing',
          startTime: currentTime,
        });

        console.log(
          `[${new Date().toISOString()}] External cron: Started player: ${
            next.name
          }`
        );

        // Обновляем локальную копию
        const nextIndex = allEntries.findIndex(e => e.id === next.id);
        if (nextIndex !== -1) {
          allEntries[nextIndex].status = 'playing';
          allEntries[nextIndex].startTime = currentTime;
        }
        changesMade++;
        continue;
      }

      // Если есть играющий, проверяем время
      if (playing && playing.startTime) {
        const elapsed = currentTime - playing.startTime;

        if (elapsed >= duration) {
          // Завершаем текущего игрока
          await updateDoc(doc(db, 'queue', playing.id), {
            status: 'done',
            startTime: 0,
          });

          console.log(
            `[${new Date().toISOString()}] External cron: Finished player: ${
              playing.name
            } (${Math.round(elapsed / 60000)}min played)`
          );

          // Обновляем локальную копию
          const playingIndex = allEntries.findIndex(e => e.id === playing.id);
          if (playingIndex !== -1) {
            allEntries[playingIndex].status = 'done';
            allEntries[playingIndex].startTime = 0;
          }

          // Запускаем следующего, если есть
          if (waiting.length > 0) {
            const next = waiting[0];
            await updateDoc(doc(db, 'queue', next.id), {
              status: 'playing',
              startTime: currentTime,
            });

            console.log(
              `[${new Date().toISOString()}] External cron: Started next player: ${
                next.name
              }`
            );

            // Обновляем локальную копию
            const nextIndex = allEntries.findIndex(e => e.id === next.id);
            if (nextIndex !== -1) {
              allEntries[nextIndex].status = 'playing';
              allEntries[nextIndex].startTime = currentTime;
            }
            changesMade++;
            continue;
          } else {
            shouldContinue = false;
          }
        } else {
          shouldContinue = false;
        }
      } else {
        shouldContinue = false;
      }
    }

    if (iterations >= maxIterations) {
      console.warn(
        `[${new Date().toISOString()}] External cron: Queue advancement stopped after max iterations`
      );
    }

    console.log(
      `[${new Date().toISOString()}] External cron: Queue advancement completed, changes: ${changesMade}`
    );

    return res.status(200).json({
      message: 'External cron executed successfully',
      changesMade,
      iterations,
      currentTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] External cron: Error advancing queue:`,
      error
    );
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
