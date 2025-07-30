import { NextApiRequest, NextApiResponse } from 'next';
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import type { QueueEntry } from '../../src/types/queue';
import type { PlatformConfig } from '../../src/lib/firebase';

// Кэш для platformConfig
let cachedConfig: PlatformConfig | null = null;
let configCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Блокировка выполнения
let isRunning = false;
let lastRunTime = 0;
const FORCE_RUN_THRESHOLD = 2 * 60 * 1000; // 2 минуты

async function getCachedPlatformConfig(): Promise<PlatformConfig | null> {
  const now = Date.now();

  // Если кэш актуален, возвращаем его
  if (cachedConfig && now - configCacheTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    // Получаем свежую конфигурацию из Firebase
    const configDoc = await getDoc(doc(db, 'config', 'platform'));
    cachedConfig = configDoc.exists()
      ? (configDoc.data() as PlatformConfig)
      : null;
    configCacheTime = now;

    console.log(`[${new Date().toISOString()}] AutoCron: Config cache updated`);

    return cachedConfig;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] AutoCron: Error fetching config:`,
      error
    );
    // В случае ошибки возвращаем старый кэш, если он есть
    return cachedConfig;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();

  // Проверяем, не выполняется ли уже autoCron
  if (isRunning) {
    console.log(
      `[${new Date().toISOString()}] AutoCron: Blocked - already running (last run: ${new Date(
        lastRunTime
      ).toISOString()})`
    );
    return res.status(429).json({
      error: 'Already running',
      lastRun: new Date(lastRunTime).toISOString(),
      blockedFor: Math.round((now - lastRunTime) / 1000),
    });
  }

  // Принудительный запуск, если последний запуск был больше 2 минут назад
  if (now - lastRunTime > FORCE_RUN_THRESHOLD && lastRunTime > 0) {
    console.warn(
      `[${new Date().toISOString()}] AutoCron: Force run after ${Math.round(
        (now - lastRunTime) / 1000
      )}s delay`
    );
  }

  // Устанавливаем блокировку
  isRunning = true;
  lastRunTime = now;

  console.log(
    `[${new Date().toISOString()}] AutoCron: Starting execution (isRunning: ${isRunning})`
  );

  try {
    await advanceQueue();
    return res.status(200).json({ message: 'Queue advanced' });
  } catch (e) {
    console.error(
      `[${new Date().toISOString()}] AutoCron: Execution error:`,
      e
    );
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    // Снимаем блокировку
    isRunning = false;
    console.log(
      `[${new Date().toISOString()}] AutoCron: Execution completed (isRunning: ${isRunning})`
    );
  }
}

async function advanceQueue() {
  // Устанавливаем таймаут для всего процесса
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `[${new Date().toISOString()}] AutoCron: Timeout reached (8s) - aborting`
      );
      reject(new Error('Execution timeout reached'));
    }, 8000); // 8 секунд максимум
  });

  try {
    // Используем Promise.race для таймаута
    await Promise.race([
      (async () => {
        console.log(
          `[${new Date().toISOString()}] AutoCron: Queue advancement started`
        );

        // Получаем настройки платформы из кэша
        const platformConfig = await getCachedPlatformConfig();

        // Проверяем ручной режим
        if (platformConfig?.manualQueue) {
          console.log(
            `[${new Date().toISOString()}] AutoCron: Manual queue mode - no advancement`
          );
          return;
        }

        // Получаем актуальную очередь из базы
        const q = await getDocs(
          query(collection(db, 'queue'), orderBy('time'))
        );
        const allEntries = q.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as QueueEntry[];

        const duration = (platformConfig?.gameDuration || 25) * 60 * 1000;
        const currentTime = Date.now();

        console.log(
          `[${new Date().toISOString()}] AutoCron: Processing ${
            allEntries.length
          } entries`
        );

        // Продвигаем очередь до тех пор, пока не найдем активного игрока
        let shouldContinue = true;
        let iterations = 0;
        const maxIterations = 5; // Уменьшили с 10 до 5
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
              `[${new Date().toISOString()}] AutoCron: Started player: ${
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
              // Создаем батч для группировки операций
              const batch = writeBatch(db);

              // Завершаем текущего игрока
              batch.update(doc(db, 'queue', playing.id), {
                status: 'done',
                startTime: 0,
              });

              console.log(
                `[${new Date().toISOString()}] AutoCron: Finished player: ${
                  playing.name
                } (${Math.round(elapsed / 60000)}min played)`
              );

              // Обновляем локальную копию
              const playingIndex = allEntries.findIndex(
                e => e.id === playing.id
              );
              if (playingIndex !== -1) {
                allEntries[playingIndex].status = 'done';
                allEntries[playingIndex].startTime = 0;
              }

              // Запускаем следующего, если есть
              if (waiting.length > 0) {
                const next = waiting[0];
                batch.update(doc(db, 'queue', next.id), {
                  status: 'playing',
                  startTime: currentTime,
                });

                console.log(
                  `[${new Date().toISOString()}] AutoCron: Started next player: ${
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
              }

              // Выполняем все операции одним батчем
              await batch.commit();

              // Продолжаем только если есть ожидающие игроки
              if (waiting.length > 0) {
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
            `[${new Date().toISOString()}] AutoCron: Queue advancement stopped after max iterations`
          );
        }

        console.log(
          `[${new Date().toISOString()}] AutoCron: Queue advancement completed, changes: ${changesMade}`
        );
      })(),
      timeoutPromise,
    ]);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] AutoCron: Error advancing queue:`,
      error
    );
  } finally {
    // Очищаем таймаут
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
