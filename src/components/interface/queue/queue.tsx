'use client';
import { useState, useEffect } from 'react';
import styles from '../../../../pages/page.module.css';
import { db } from '../../../lib/firebase';
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
import { QueueEntry } from '../../../types/queue';

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
        <div style={{ display: 'flex', justifyContent: 'center' }}></div>
        <h1 className={styles.heading} style={{ zIndex: 1 }}>
          🎱 Очередь на бильярд{' '}
        </h1>
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
