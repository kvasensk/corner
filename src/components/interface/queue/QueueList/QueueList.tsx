import styles from './QueueList.module.css';
import { QueueEntry } from '../../../../types/queue';
import { useEffect, useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import AdminQueueModal from '../AdminQueueModal/AdminQueueModal';

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

function useTimeLeft(startTimeStr: string | null) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!startTimeStr) return;
    const startTime = new Date(startTimeStr);
    const update = () =>
      setTimeLeft(25 * 60 * 1000 - (Date.now() - startTime.getTime()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTimeStr]);
  return timeLeft;
}

function QueueCard({
  entry,
  idx,
  startTime,
}: {
  entry: QueueEntry;
  idx: number;
  startTime: Date | null;
}) {
  const waitMs =
    (idx + 1) * 25 * 60 * 1000 -
    (startTime ? Date.now() - startTime.getTime() : 0);
  return (
    <div className={styles.card} key={entry.id}>
      <div className={styles.cardContent}>
        <span className={styles.name}>{entry.name}</span>
        <span className={styles.queueTime}>
          (
          {new Date(entry.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          )
        </span>
      </div>
      <span className={styles.timeInfo}>
        Начало через
        <span className={styles.timeValue}>~{formatTimeLeft(waitMs)}</span>
      </span>
    </div>
  );
}

export default function QueueList({
  waiting,
  done,
  loading,
  isAdmin,
  syncStatuses,
}: {
  waiting: Array<QueueEntry & { waitMs: number }>;
  done: QueueEntry[];
  loading: boolean;
  isAdmin?: boolean;
  syncStatuses: () => Promise<void>;
}) {
  const [modalUser, setModalUser] = useState<QueueEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const handleDelete = async () => {
    if (!modalUser) return;
    setDeleting(true);
    await deleteDoc(doc(db, 'queue', modalUser.id));
    setDeleting(false);
    setModalUser(null);
    await syncStatuses();
  };

  const handleDone = async () => {
    if (!modalUser) return;
    setFinishing(true);
    await updateDoc(doc(db, 'queue', modalUser.id), { status: 'done' });
    setFinishing(false);
    setModalUser(null);
    await syncStatuses();
  };

  if (loading)
    return (
      <ul className={styles.list}>
        <li className={styles.empty}>Загрузка...</li>
      </ul>
    );
  if (waiting.length === 0 && done.length === 0)
    return (
      <ul className={styles.list}>
        <li className={styles.empty}>Очередь пуста</li>
      </ul>
    );
  return (
    <div className={styles.queueWrap}>
      <div className={styles.queueBlock}>
        {waiting.map((entry, idx) => (
          <div className={styles.card} key={entry.id}>
            <div className={styles.cardContent}>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.queueTime}>
                (
                {new Date(entry.time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
              {isAdmin && (
                <span className={styles.statusTag}>
                  {entry.status === 'playing' && 'Играет'}
                  {entry.status === 'waiting' && 'В очереди'}
                  {entry.status === 'done' && 'Сыграл'}
                </span>
              )}
            </div>
            <div className={styles.wrap}>
              <span className={styles.timeInfo}>
                Начало через
                <span className={styles.timeValue}>
                  ~{formatTimeLeft(entry.waitMs)}
                </span>
              </span>
              {isAdmin && (
                <button
                  className={styles.adminMenuBtn}
                  onClick={e => {
                    e.stopPropagation();
                    setModalUser(entry);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                    setModalUser(entry);
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
        ))}
        {done.map(entry => (
          <div className={`${styles.card} ${styles.cardDone}`} key={entry.id}>
            <div className={styles.cardContent}>
              <span className={`${styles.name} ${styles.nameDone}`}>
                {entry.name}
              </span>
              <span className={styles.queueTime}>
                (
                {new Date(entry.time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
              {/* {isAdmin && (
                <button
                  className={styles.adminMenuBtn}
                  onClick={e => {
                    e.stopPropagation();
                    setModalUser(entry);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                    setModalUser(entry);
                  }}
                  title='Управление'
                >
                  &#8942;
                </button>
              )} */}
              {isAdmin && (
                <span className={styles.statusTag}>
                  {entry.status === 'playing' && 'Играет'}
                  {entry.status === 'waiting' && 'В очереди'}
                  {entry.status === 'done' && 'Сыграл'}
                </span>
              )}
            </div>
            <span className={styles.timeInfo}>Сыграл</span>
          </div>
        ))}
      </div>
      <AdminQueueModal
        user={modalUser}
        open={!!modalUser}
        onClose={() => setModalUser(null)}
        onDelete={handleDelete}
        onDone={handleDone}
        deleting={deleting}
        finishing={finishing}
      />
    </div>
  );
}
