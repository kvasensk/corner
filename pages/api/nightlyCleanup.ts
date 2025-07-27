import { NextApiRequest, NextApiResponse } from 'next';
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import type { QueueEntry } from '../../src/types/queue';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`[${new Date().toISOString()}] Nightly cleanup called`);

  try {
    // Получаем всю очередь
    const q = await getDocs(query(collection(db, 'queue'), orderBy('time')));
    const allEntries = q.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as QueueEntry[];

    console.log(
      `[${new Date().toISOString()}] Nightly cleanup: Found ${
        allEntries.length
      } entries to delete`
    );

    // Удаляем все записи
    const deletePromises = allEntries.map(entry =>
      deleteDoc(doc(db, 'queue', entry.id))
    );

    await Promise.all(deletePromises);

    console.log(
      `[${new Date().toISOString()}] Nightly cleanup: Deleted all ${
        allEntries.length
      } entries`
    );

    return res.status(200).json({
      message: 'Nightly cleanup completed successfully - queue fully cleared',
      deletedCount: allEntries.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Nightly cleanup: Error:`,
      error
    );
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
