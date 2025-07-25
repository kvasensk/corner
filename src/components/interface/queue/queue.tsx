'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './queue.module.css';
import cornerLogo from '../../../../public/assets/images/logo.png';
import { db } from '../../../lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import QueueList from './QueueList/QueueList';
import NowPlayingBlock from './NowPlaying/NowPlayingBlock';
import { QueueEntry } from '../../../types/queue';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { getPlatformConfig, PlatformConfig } from '../../../lib/firebase';

export default function Queue() {
  const [name, setName] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState<QueueEntry | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(
    null
  );

  useEffect(() => {
    const q = query(collection(db, 'queue'), orderBy('time'));
    const unsub = onSnapshot(q, snapshot => {
      setQueue(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as QueueEntry[]
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getPlatformConfig().then(setPlatformConfig);
  }, []);

  // --- Синхронизация статусов с базой (функция) ---
  const syncStatuses = async () => {
    if (!current && waiting.length === 0 && done.length === 0) return;
    // current
    if (current) {
      if (current.status !== 'playing' || !current.startTime) {
        await updateDoc(doc(db, 'queue', current.id), {
          status: 'playing',
          startTime: current.startTime || Date.now(),
        });
      }
    }
    // waiting
    for (const entry of waiting) {
      if (entry.status !== 'waiting' || entry.startTime !== 0) {
        await updateDoc(doc(db, 'queue', entry.id), {
          status: 'waiting',
          startTime: 0,
        });
      }
    }
    // done
    for (const entry of done) {
      if (entry.status !== 'done' || entry.startTime !== 0) {
        await updateDoc(doc(db, 'queue', entry.id), {
          status: 'done',
          startTime: 0,
        });
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, 'queue'), {
      name: name.trim(),
      time: new Date().toISOString(),
      status: 'waiting',
      startTime: 0,
    });
    setName('');
    syncStatuses();
  };

  // --- Новый алгоритм очереди (useMemo для чистоты, done внизу) ---
  const { current, timeLeft, waiting, done } = useMemo(() => {
    const now = Date.now();
    const done = queue.filter(q => q.status === 'done');
    const notDone = queue.filter(q => q.status !== 'done');
    let current: QueueEntry | null = null;
    let timeLeft = 0;
    const waiting: Array<QueueEntry & { waitMs: number }> = [];
    let prevEnd: number | null = null;
    for (let i = 0; i < notDone.length; i++) {
      const entry = notDone[i];
      let entryStart: number = 0;
      if (entry.startTime && entry.startTime > 0) {
        entryStart = entry.startTime;
      } else if (prevEnd !== null) {
        entryStart = Math.max(new Date(entry.time).getTime(), prevEnd);
      } else {
        entryStart = new Date(entry.time).getTime();
      }
      const entryEnd: number = entryStart + 25 * 60 * 1000;
      if (now >= entryStart && now < entryEnd && !current) {
        current = entry;
        timeLeft = entryEnd - now;
        prevEnd = entryEnd;
      } else if (!current) {
        prevEnd = entryEnd;
      } else {
        waiting.push({ ...entry, waitMs: entryStart - now });
        prevEnd = entryEnd;
      }
    }
    return { current, timeLeft, waiting, done };
  }, [queue]);

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);
  const router = useRouter();

  async function handleClearQueue() {
    const q = await getDocs(collection(db, 'queue'));
    const batch: Promise<void>[] = [];
    q.forEach(docSnap => {
      batch.push(deleteDoc(doc(db, 'queue', docSnap.id)));
    });
    await Promise.all(batch);
    setShowModal(false);
  }

  // --- Синхронизация статусов с базой раз в минуту (только для админа) ---
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => {
      // Синхронизируем статусы только если isAdmin
      const syncStatuses = async () => {
        // current
        if (current && current.status !== 'playing') {
          await updateDoc(doc(db, 'queue', current.id), { status: 'playing' });
        }
        // waiting
        for (const entry of waiting) {
          if (entry.status !== 'waiting') {
            await updateDoc(doc(db, 'queue', entry.id), { status: 'waiting' });
          }
        }
        // done
        for (const entry of done) {
          if (entry.status !== 'done') {
            await updateDoc(doc(db, 'queue', entry.id), { status: 'done' });
          }
        }
      };
      syncStatuses();
    }, 60000); // раз в минуту
    return () => clearInterval(interval);
  }, [isAdmin, current, waiting, done]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image
            src={cornerLogo}
            alt='Corner Coffee Spot Logo'
            width={112}
            height={63}
            className={styles.logoImage}
          />
        </div>
        <div className={styles.menu}>
          <button className={styles.menuActive} type='button'>
            Бильярд
          </button>
          {platformConfig?.showMenuTab && (
            <button className={styles.menuInactive} type='button'>
              Меню
            </button>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className={styles.adminPanel}>
          <div
            className={styles.adminInformer}
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/admin')}
          >
            Администратор
          </div>
          <button
            className={styles.adminBtnClear}
            onClick={() => setShowModal(true)}
          >
            Очистить очередь
          </button>
        </div>
      )}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div>Вы уверены, что хотите очистить всю очередь?</div>
            <div>
              <button onClick={handleClearQueue}>Да, очистить</button>
              <button onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.queueContainer}>
        {current && (
          <NowPlayingBlock
            current={current}
            timeLeft={timeLeft}
            isAdmin={isAdmin}
            onAdminMenuClick={() => setModalUser(current)}
          />
        )}
      </div>
      <div className={styles.queueLabel}>Очередь:</div>
      <div className={styles.queueScroll}>
        <QueueList
          waiting={waiting}
          done={done}
          loading={loading}
          isAdmin={isAdmin}
          syncStatuses={syncStatuses}
        />
      </div>
      <div className={styles.formBlock}>
        <div className={styles.formHintRow}>
          <span className={styles.formHint}>
            Чтобы встать в очередь, нужно купить напиток и подождать*
          </span>
          <span className={styles.formInfoIcon}>i</span>
        </div>
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formInner}>
            <input
              type='text'
              placeholder='Имя'
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              autoFocus
              maxLength={20}
            />
            <button
              type='submit'
              className={styles.button}
              disabled={!name.trim()}
              aria-label='В очередь'
            >
              В очередь
            </button>
          </div>
        </form>
        <div className={styles.formNote}>*1 напиток ~ 25 минут</div>
      </div>
    </div>
  );
}
