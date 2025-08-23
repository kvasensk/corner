import styles from './QueueList.module.css';
import { QueueEntry } from '../../../../types/queue';
import { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import AdminQueueModal from '../AdminQueueModal/AdminQueueModal';

export default function QueueList({
  waiting,
  done,
  loading,
  isAdmin,
  manualQueue = false,
  onQueueChange,
  deviceId,
}: {
  waiting: QueueEntry[];
  done: QueueEntry[];
  loading: boolean;
  isAdmin?: boolean;
  manualQueue?: boolean;
  onQueueChange?: () => void;
  deviceId?: string | null;
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

    // Уведомляем родительский компонент об изменении очереди
    if (manualQueue && onQueueChange) {
      setTimeout(() => {
        onQueueChange();
      }, 100);
    }
  };

  const handleDone = async () => {
    if (!modalUser) return;
    setFinishing(true);
    await updateDoc(doc(db, 'queue', modalUser.id), {
      status: 'done',
      startTime: 0,
    });
    setFinishing(false);
    setModalUser(null);

    // Уведомляем родительский компонент об изменении очереди
    if (manualQueue && onQueueChange) {
      setTimeout(() => {
        onQueueChange();
      }, 100);
    }
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
              {!manualQueue && (
                <span className={styles.timeInfo}>В очереди</span>
              )}
              {(isAdmin ||
                manualQueue ||
                (deviceId && entry.deviceId === deviceId)) && (
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
              {(isAdmin || manualQueue) && (
                <span className={styles.statusTag}>
                  {entry.status === 'playing' && 'Играет'}
                  {entry.status === 'waiting' && 'В очереди'}
                  {entry.status === 'done' && 'Сыграл'}
                </span>
              )}
            </div>
            {!manualQueue && <span className={styles.timeInfo}>Сыграл</span>}
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
