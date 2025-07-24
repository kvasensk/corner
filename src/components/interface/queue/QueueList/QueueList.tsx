import styles from './QueueList.module.css';
import { QueueEntry } from '../../../../types/queue';
import { useEffect, useState } from 'react';

interface QueueListProps {
  queue: QueueEntry[];
  loading: boolean;
  startTime: Date | null;
  now: Date;
}

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '0 мин';
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}ч ${m} мин` : `${m} мин`;
}

export default function QueueList({
  queue,
  loading,
  startTime,
  now,
}: QueueListProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setTimeLeft(25 * 60 * 1000 - (Date.now() - startTime.getTime()));
    }, 1000);
    setTimeLeft(25 * 60 * 1000 - (Date.now() - startTime.getTime()));
    return () => clearInterval(interval);
  }, [startTime]);

  if (loading)
    return (
      <ul className={styles.list}>
        <li className={styles.empty}>Загрузка...</li>
      </ul>
    );
  if (queue.length === 0)
    return (
      <ul className={styles.list}>
        <li className={styles.empty}>Очередь пуста</li>
      </ul>
    );

  const [current, ...rest] = queue;
  return (
    <div className={styles.queueWrap}>
      <div className={styles.nowPlayingBlock}>
        <div className={styles.label}>Играет сейчас:</div>
        <div className={styles.card}>
          <span className={styles.name}>{current.name}</span>
          <span className={styles.timeInfo}>
            Осталось играть
            <span className={styles.timeValue}>{formatTimeLeft(timeLeft)}</span>
          </span>
        </div>
      </div>
      <div className={styles.queueBlock}>
        <div className={styles.label}>Очередь:</div>
        {rest.length === 0 ? (
          <div className={styles.empty}>Очередь пуста</div>
        ) : (
          rest.map((entry, idx) => {
            // Время ожидания = (idx+1) * 25 мин - остаток текущего таймера
            const waitMs =
              (idx + 1) * 25 * 60 * 1000 -
              (startTime ? Date.now() - startTime.getTime() : 0);
            return (
              <div className={styles.card} key={entry.id}>
                <span className={styles.name}>{entry.name}</span>
                <span className={styles.timeInfo}>
                  Начало через
                  <span className={styles.timeValue}>
                    {formatTimeLeft(waitMs)}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
