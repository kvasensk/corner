import styles from './NowPlayingBlock.module.css';
import { QueueEntry } from '../../../../types/queue';

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '0 мин';
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}ч ${m} мин` : `${m} мин`;
}

export default function NowPlayingBlock({
  current,
  timeLeft,
  isAdmin,
  manualQueue,
  onAdminMenuClick,
}: {
  current: QueueEntry;
  timeLeft: number;
  isAdmin?: boolean;
  manualQueue?: boolean;
  onAdminMenuClick?: () => void;
}) {
  const total = 25;
  const played = Math.floor((1 - timeLeft / (25 * 60 * 1000)) * total);
  return (
    <div className={styles.nowPlayingBlock}>
      <div className={styles.label}>Играет сейчас:</div>
      <div className={styles.card}>
        <div className={styles.progressBg}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={styles.progressBar}
              style={{
                background: i < played ? '#103ef5' : '#2a3e7c',
                opacity: i < played ? 0.7 : 0.2,
              }}
            />
          ))}
        </div>
        <div className={styles.cardContent}>
          <span className={styles.name}>{current.name}</span>
          <span className={styles.queueTime}>
            (
            {new Date(current.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            )
          </span>
          {(isAdmin || manualQueue) && (
            <span className={styles.statusTag}>
              {current.status === 'playing' && 'Играет'}
              {current.status === 'waiting' && 'В очереди'}
              {current.status === 'done' && 'Сыграл'}
            </span>
          )}
        </div>
        <div className={styles.wrap}>
          {!manualQueue && (
            <span className={styles.timeInfo}>
              Осталось играть
              <span className={styles.timeValue}>
                ~{formatTimeLeft(timeLeft)}
              </span>
            </span>
          )}
          {(isAdmin || manualQueue) && (
            <button
              className={styles.adminMenuBtn}
              onClick={e => {
                e.stopPropagation();
                onAdminMenuClick && onAdminMenuClick();
              }}
              onTouchStart={e => {
                e.stopPropagation();
                onAdminMenuClick && onAdminMenuClick();
              }}
              title='Управление'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='10' fill='#e0eaff' />
                <circle cx='12' cy='8' r='1.5' fill='#1746d3' />
                <circle cx='12' cy='12' r='1.5' fill='#1746d3' />
                <circle cx='12' cy='16' r='1.5' fill='#1746d3' />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
