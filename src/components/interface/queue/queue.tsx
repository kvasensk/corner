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
  setDoc,
  getDoc,
} from 'firebase/firestore';
import QueueList from './QueueList/QueueList';
import NowPlayingBlock from './NowPlaying/NowPlayingBlock';
import { QueueEntry } from '../../../types/queue';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { usePlatformConfig } from '../../../lib/PlatformConfigContext';
import type { PlatformConfig } from '../../../lib/firebase';
import AdminQueueModal from './AdminQueueModal/AdminQueueModal';

export default function Queue() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState<QueueEntry | null>(null);
  const { config: platformConfig, loading: configLoading } =
    usePlatformConfig();
  const [deleting, setDeleting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoData, setInfoData] = useState<{
    automatic: { useDescription: boolean; description: string } | null;
    manual: { useDescription: boolean; description: string } | null;
  }>({
    automatic: null,
    manual: null,
  });

  // Очистка очереди
  async function handleClearQueue() {
    try {
      const q = await getDocs(collection(db, 'queue'));
      const batch: Promise<void>[] = [];
      q.forEach(docSnap => {
        batch.push(deleteDoc(doc(db, 'queue', docSnap.id)));
      });
      await Promise.all(batch);
      setShowModal(false);

      // В мануальном режиме синхронизируем статусы после очистки
      if (manualQueue) {
        setTimeout(() => {
          syncManualStatuses();
        }, 100);
      }
    } catch (error) {
      // Ошибка очистки очереди
    }
  }

  // Удаление игрока
  const handleDelete = async () => {
    if (!modalUser) return;
    setDeleting(true);
    await deleteDoc(doc(db, 'queue', modalUser.id));
    setDeleting(false);
    setModalUser(null);

    // В мануальном режиме синхронизируем статусы после удаления
    if (manualQueue) {
      setTimeout(() => {
        syncManualStatuses();
      }, 100); // Небольшая задержка для обновления состояния
    }
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

    // В мануальном режиме синхронизируем статусы после завершения
    if (manualQueue) {
      setTimeout(() => {
        syncManualStatuses();
      }, 100); // Небольшая задержка для обновления состояния
    }
  };

  // Добавление игрока
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
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

      // В мануальном режиме синхронизируем статусы после добавления
      if (manualQueue) {
        setTimeout(() => {
          syncManualStatuses();
        }, 100);
      }
    } catch (error) {
      // Ошибка добавления игрока
    }
  };

  const manualQueue = !!platformConfig?.manualQueue;
  const gameDuration = platformConfig?.gameDuration || 25;

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
    // Используем gameDuration из platformConfig, если есть
    const duration =
      platformConfig && (platformConfig as PlatformConfig).gameDuration
        ? (platformConfig as PlatformConfig).gameDuration
        : 25;
    const GAME_DURATION = duration * 60 * 1000;
    // Если ручной режим — не считаем таймеры
    let timeLeft = 0;
    if (!manualQueue && current && current.startTime) {
      // Используем серверное время для точного расчета
      const elapsed = nowMs - current.startTime;
      timeLeft = GAME_DURATION - elapsed;
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

  // Обновление времени в базе каждые 30 секунд (чтобы время шло даже без клиентов)
  useEffect(() => {
    const updateServerTime = async () => {
      try {
        await updateDoc(doc(db, 'config', 'serverTime'), {
          lastUpdate: Date.now(),
        });
      } catch (error) {
        // Если документ не существует, создаем его
        await setDoc(doc(db, 'config', 'serverTime'), {
          lastUpdate: Date.now(),
        });
      }
    };

    // Обновляем сразу при загрузке
    updateServerTime();

    // Затем каждые 10 секунд (было 30)
    const interval = setInterval(updateServerTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Подписка на серверное время
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'serverTime'), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.lastUpdate) {
          setNow(data.lastUpdate);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // getPlatformConfig().then(setPlatformConfig); // Удалено
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);

  // Фикс: при выключении ручного режима реактивировать playing
  useEffect(() => {
    if (!manualQueue && !current && waiting.length > 0) {
      const next = waiting[0];
      updateDoc(doc(db, 'queue', next.id), {
        status: 'playing',
        startTime: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualQueue]);

  // Функция для синхронизации статусов в мануальном режиме
  const syncManualStatuses = async () => {
    if (!manualQueue) return; // Только для мануального режима

    try {
      // Получаем актуальную очередь из базы
      const q = await getDocs(query(collection(db, 'queue'), orderBy('time')));
      const allEntries = q.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as QueueEntry[];

      const playing = allEntries.find(q => q.status === 'playing');
      const waiting = allEntries
        .filter(q => q.status === 'waiting')
        .sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );

      // Если нет играющего, но есть ожидающие - назначаем следующего
      if (!playing && waiting.length > 0) {
        const next = waiting[0];

        await updateDoc(doc(db, 'queue', next.id), {
          status: 'playing',
          startTime: Date.now(),
        });
      }
    } catch (error) {
      // Ошибка синхронизации статусов
    }
  };

  // Синхронизируем статусы при изменении очереди в мануальном режиме
  useEffect(() => {
    if (manualQueue && queue.length > 0) {
      const playing = queue.find(q => q.status === 'playing');
      const waiting = queue.filter(q => q.status === 'waiting');

      // Если нет играющего, но есть ожидающие - синхронизируем
      if (!playing && waiting.length > 0) {
        syncManualStatuses();
      }
    }
  }, [queue, manualQueue]);

  // Дополнительная синхронизация при изменении current в мануальном режиме
  useEffect(() => {
    if (manualQueue && !current && waiting.length > 0) {
      // Если нет активного игрока, но есть ожидающие - назначаем следующего
      syncManualStatuses();
    }
  }, [current, waiting, manualQueue]);

  // Загружаем info данные
  useEffect(() => {
    const loadInfoData = async () => {
      try {
        // Загружаем automatic info
        const automaticDoc = await getDoc(doc(db, 'info', 'automatic'));
        const automaticData = automaticDoc.exists()
          ? (automaticDoc.data() as {
              useDescription: boolean;
              description: string;
            })
          : null;

        // Загружаем manual info
        const manualDoc = await getDoc(doc(db, 'info', 'manual'));
        const manualData = manualDoc.exists()
          ? (manualDoc.data() as {
              useDescription: boolean;
              description: string;
            })
          : null;

        setInfoData({
          automatic: automaticData,
          manual: manualData,
        });
      } catch (error) {
        console.error('Error loading info data:', error);
      }
    };

    loadInfoData();
  }, []);

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
          <button
            className={styles.menuActive}
            type='button'
            onClick={() => router.push('/')}
          >
            Бильярд
          </button>
          {platformConfig?.showMenuTab && (
            <button
              className={styles.menuInactive}
              type='button'
              onClick={() => router.push('/menu')}
            >
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
      {showInfoModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.infoModal}>
            <div className={styles.infoModalContent}>
              <h3>Информация</h3>
              {manualQueue ? (
                <p>
                  {infoData.manual?.useDescription &&
                  infoData.manual?.description
                    ? infoData.manual.description
                    : 'Пожалуйста, завершите свою игру в очереди после окончания партии.'}
                </p>
              ) : (
                <p>
                  {infoData.automatic?.useDescription &&
                  infoData.automatic?.description
                    ? infoData.automatic.description
                    : 'За помощью можно обратиться к Бариста.'}
                </p>
              )}
              <button onClick={() => setShowInfoModal(false)}>Понятно</button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.main}>
        <div className={styles.queueContainer}>
          {current && (
            <NowPlayingBlock
              current={current}
              timeLeft={timeLeft}
              isAdmin={isAdmin}
              manualQueue={manualQueue}
              gameDuration={platformConfig?.gameDuration || 25}
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
            manualQueue={manualQueue}
            onQueueChange={syncManualStatuses}
          />
        </div>
        <div className={styles.formBlock}>
          <div className={styles.formHintRow}>
            <span className={styles.formHint}>
              Чтобы встать в очередь, нужно купить напиток и подождать*
            </span>
            <span
              className={styles.formInfoIcon}
              onClick={() => setShowInfoModal(true)}
              style={{ cursor: 'pointer' }}
            >
              i
            </span>
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
    </div>
  );
}
