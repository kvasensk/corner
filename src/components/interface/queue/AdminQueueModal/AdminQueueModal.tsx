import styles from './AdminQueueModal.module.css';
import { QueueEntry } from '../../../../types/queue';
import { FaTrash } from 'react-icons/fa';

interface AdminQueueModalProps {
  user: QueueEntry | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onDone: () => void;
  deleting: boolean;
  finishing: boolean;
}

export default function AdminQueueModal({
  user,
  open,
  onClose,
  onDelete,
  onDone,
  deleting,
  finishing,
}: AdminQueueModalProps) {
  if (!open || !user) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.userInfoRow}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userStatus}>
            {user.status === 'playing' && 'Играет'}
            {user.status === 'waiting' && 'В очереди'}
            {user.status === 'done' && 'Сыграл'}
          </span>
          <button
            className={styles.deleteIconBtn}
            onClick={onDelete}
            disabled={deleting}
            title='Удалить'
          >
            <FaTrash size={16} />
          </button>
        </div>
        <button
          onClick={onDone}
          disabled={finishing || user.status !== 'playing'}
          className={styles.doneBtn}
        >
          {finishing
            ? 'Завершение...'
            : user.status === 'done'
            ? 'Игра завершена'
            : user.status === 'playing'
            ? 'Завершить игру'
            : 'Ожидание начала'}
        </button>
        <button
          onClick={onClose}
          disabled={deleting || finishing}
          className={styles.cancelBtn}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
