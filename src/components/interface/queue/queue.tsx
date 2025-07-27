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
import AdminQueueModal from './AdminQueueModal/AdminQueueModal';

export default function Queue() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState<QueueEntry | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Очистка очереди
  async function handleClearQueue() {
    const q = await getDocs(collection(db, 'queue'));
    const batch: Promise<void>[] = [];
    q.forEach(docSnap => {
      batch.push(deleteDoc(doc(db, 'queue', docSnap.id)));
    });
    await Promise.all(batch);
    setShowModal(false);
  }

  // Удаление игрока
  const handleDelete = async () => {
    if (!modalUser) return;
    setDeleting(true);
    await deleteDoc(doc(db, 'queue', modalUser.id));
    setDeleting(false);
    setModalUser(null);
  };

  // Завершение игры для игрока
  const handleDone = async () => {
    if (!modalUser) return;
    setFinishing(true);
    await updateDoc(doc(db, 'queue', modalUser.id), {
      status: 'done',
      startTime: 0,
    });
    setFinishing(false);
    setModalUser(null);
  };

  // Добавление игрока
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Проверяем, есть ли сейчас playing или waiting
    const q = await getDocs(collection(db, 'queue'));
    const entries = q.docs.map(doc => doc.data() as QueueEntry);
    const hasActive = entries.some(
      q => q.status === 'playing' || q.status === 'waiting'
    );
    await addDoc(collection(db, 'queue'), {
      name: name.trim(),
      time: new Date().toISOString(),
      status: hasActive ? 'waiting' : 'playing',
      startTime: hasActive ? 0 : Date.now(),
    });
    setName('');
  };

  // Основная логика очереди
  const { current, timeLeft, waiting, done } = useMemo(() => {
    const nowMs = now;
    const playing = queue.find(q => q.status === 'playing');
    const waiting = queue
      .filter(q => q.status === 'waiting')
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const done = queue
      .filter(q => q.status === 'done')
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const current = playing || null;
    let timeLeft = 0;
    // Используем gameDuration из platformConfig, если есть
    const duration =
      platformConfig && (platformConfig as PlatformConfig).gameDuration
        ? (platformConfig as PlatformConfig).gameDuration
        : 25;
    const GAME_DURATION = duration * 60 * 1000;
    if (current && current.startTime) {
      timeLeft = GAME_DURATION - (nowMs - current.startTime);
      if (timeLeft < 0) timeLeft = 0;
    }
    return { current, timeLeft, waiting, done };
  }, [queue, now, platformConfig]);

  // Подписка на очередь
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

  // Таймер для обновления времени
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getPlatformConfig().then(setPlatformConfig);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);

  // Автоматическое продвижение очереди
  useEffect(() => {
    if (!current) {
      // Если нет playing, назначаем первого waiting как playing и ставим startTime
      if (waiting.length > 0) {
        const next = waiting[0];
        updateDoc(doc(db, 'queue', next.id), {
          status: 'playing',
          startTime: Date.now(),
        });
      }
      return;
    }
    // Если время вышло, переводим current в done, сбрасываем startTime, следующего waiting в playing (или просто done)
    if (timeLeft === 0 && current.startTime) {
      updateDoc(doc(db, 'queue', current.id), { status: 'done', startTime: 0 });
      if (waiting.length > 0) {
        const next = waiting[0];
        updateDoc(doc(db, 'queue', next.id), {
          status: 'playing',
          startTime: Date.now(),
        });
      }
      // Теперь current всегда уходит в done, даже если нет waiting
    }
  }, [current, timeLeft, waiting]);

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
          <div
            className={styles.adminBtnClear}
            onClick={() => setShowModal(true)}
          >
            Очистить очередь
          </div>
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
      <AdminQueueModal
        user={modalUser}
        open={!!modalUser}
        onClose={() => setModalUser(null)}
        onDelete={handleDelete}
        onDone={handleDone}
        deleting={deleting}
        finishing={finishing}
      />
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
        <div className={styles.formNote}>
          *1 напиток ~ {platformConfig?.gameDuration ?? 25} минут
        </div>
      </div>
    </div>
  );
}
