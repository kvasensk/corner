import styles from './QueueList.module.css';
import { QueueEntry } from '../../../types/queue';

interface QueueListProps {
  queue: QueueEntry[];
  loading: boolean;
  handleRemove: (id: string) => void;
}

export default function QueueList({
  queue,
  loading,
  handleRemove,
}: QueueListProps) {
  return (
    <ul className={styles.list}>
      {loading && <li className={styles.empty}>Загрузка...</li>}
      {!loading && queue.length === 0 && (
        <li className={styles.empty}>Очередь пуста</li>
      )}
      {queue.map(entry => (
        <li className={styles.item} key={entry.id}>
          <span>
            <span className={styles.name}>{entry.name}</span>{' '}
            <span className={styles.time}>
              (
              {new Date(entry.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              )
            </span>
          </span>
          <button
            onClick={() => handleRemove(entry.id)}
            className={styles.remove}
            aria-label='Удалить'
            title='Удалить из очереди'
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
