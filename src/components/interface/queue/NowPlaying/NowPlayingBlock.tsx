import styles from './NowPlayingBlock.module.css';
import { QueueEntry } from '../../../../types/queue';

function formatTimeLeft(ms: number) {
  if (ms <= 0) return '0 мин';
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}ч ${m} мин` : `${m + 1} мин`;
}

export default function NowPlayingBlock({
  current,
  timeLeft,
  isAdmin,
  manualQueue,
  gameDuration = 25,
  onAdminMenuClick,
  deviceId,
  cardBg1,
  cardBg2,
  textColor,
}: {
  current: QueueEntry;
  timeLeft: number;
  isAdmin?: boolean;
  manualQueue?: boolean;
  gameDuration?: number;
  onAdminMenuClick?: () => void;
  deviceId?: string | null;
  cardBg1?: string;
  cardBg2?: string;
  textColor?: string;
}) {
  // В ручном режиме показываем сплошной фон (одно деление)
  const total = manualQueue ? 1 : gameDuration;
  const totalTime = gameDuration * 60 * 1000;
  const played = manualQueue
    ? 1
    : Math.floor((1 - timeLeft / totalTime) * total);

  return (
    <div className={styles.nowPlayingBlock}>
      <div className={styles.label} style={{ color: textColor }}>
        Играет сейчас:
      </div>
      <div
        className={styles.card}
        style={{ color: textColor, background: cardBg1 }}
      >
        <div className={styles.progressBg}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={styles.progressBar}
              style={{
                background:
                  i < played ? cardBg1 || '#103ef5' : cardBg2 || '#2a3e7c',
                opacity: i < played ? 0.7 : 0.2,
              }}
            />
          ))}
        </div>
        <div className={styles.cardContent}>
          <span className={styles.name} style={{ color: textColor }}>
            {current.name}
          </span>
          <span className={styles.queueTime} style={{ color: textColor }}>
            (
            {new Date(current.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            )
          </span>
        </div>
        <div className={styles.wrap}>
          {!manualQueue && (
            <span className={styles.timeInfo} style={{ color: textColor }}>
              Осталось играть
              <span className={styles.timeValue} style={{ color: textColor }}>
                ~{formatTimeLeft(timeLeft)}
              </span>
            </span>
          )}
          {(isAdmin ||
            manualQueue ||
            (deviceId && current.deviceId === deviceId)) && (
            <button
              className={styles.adminMenuBtn}
              onClick={e => {
                e.stopPropagation();
                if (onAdminMenuClick) onAdminMenuClick();
              }}
              onTouchStart={e => {
                e.stopPropagation();
                if (onAdminMenuClick) onAdminMenuClick();
              }}
              title='Управление'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='10' fill={textColor || '#e0eaff'} />
                <circle cx='12' cy='8' r='1.5' fill={cardBg1 || '#1746d3'} />
                <circle cx='12' cy='12' r='1.5' fill={cardBg1 || '#1746d3'} />
                <circle cx='12' cy='16' r='1.5' fill={cardBg1 || '#1746d3'} />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
