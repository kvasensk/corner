'use client';
import { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import QueueList from './QueueList/QueueList';
import { QueueEntry } from '../../types/queue';

export default function Queue() {
  const [name, setName] = useState('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, 'queue'), {
      name: name.trim(),
      time: new Date().toISOString(),
    });
    setName('');
  };

  const handleRemove = async (id: string) => {
    await deleteDoc(doc(db, 'queue', id));
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg
            width='36'
            height='24'
            viewBox='0 0 48 32'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <ellipse cx='24' cy='16' rx='10' ry='12' fill='#ff69b4' />
            <ellipse cx='10' cy='16' rx='10' ry='12' fill='#ffb6d5' />
            <ellipse cx='38' cy='16' rx='10' ry='12' fill='#ffb6d5' />
            <circle
              cx='24'
              cy='16'
              r='7'
              fill='#fff0f6'
              stroke='#e75480'
              strokeWidth='2'
            />
          </svg>
        </div>
        <h1 className={styles.heading}>🎱 Очередь на бильярд </h1>
        <form onSubmit={handleAdd} className={styles.form}>
          <input
            type='text'
            placeholder='Ваше имя'
            value={name}
            onChange={e => setName(e.target.value)}
            className={styles.inputText}
            autoFocus
            maxLength={20}
          />
          <button
            type='submit'
            className={styles.submitButton}
            disabled={!name.trim()}
            aria-label='Добавить в очередь'
          >
            +
          </button>
        </form>
        <QueueList
          queue={[...queue].reverse()}
          loading={loading}
          handleRemove={handleRemove}
        />
      </main>
    </div>
  );
}
