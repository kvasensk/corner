'use client';
import { useState, useEffect } from 'react';
import styles from './queue.module.css';
import { db } from '../../../lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import QueueList from './QueueList/QueueList';
import { QueueEntry } from '../../../types/queue';

export default function Queue() {
  const [name, setName] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, 'queue'), {
      name: name.trim(),
      time: new Date().toISOString(),
    });
    setName('');
  };

  // Определяем время старта для первого в очереди
  const startTime = queue.length > 0 ? new Date(queue[0].time) : null;

  return (
    <div className={styles.page}>
      {/* Шапка и меню */}
      <header className={styles.header}>
        <div className={styles.notch}></div>
        <div className={styles.logo}>
          <span className={styles.logoFont}>CORNER</span>
          <span className={styles.logoSub}>COFFEE SPOT</span>
        </div>
        <nav className={styles.menu}>
          <button className={styles.menuActive} type='button'>
            Бильярд
          </button>
          <button className={styles.menuInactive} type='button'>
            Меню
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        <QueueList
          queue={queue}
          loading={loading}
          startTime={startTime}
          now={now}
        />
      </main>
      {/* Форма добавления в очередь */}
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
      </div>
      <div className={styles.formNote}>*1 напиток = 20 минут</div>
    </div>
  );
}
