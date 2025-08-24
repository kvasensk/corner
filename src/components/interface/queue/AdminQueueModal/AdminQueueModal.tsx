import styles from './AdminQueueModal.module.css';
import { QueueEntry } from '../../../../types/queue';
import { FaTrash } from 'react-icons/fa';
import React from 'react';
import ReactDOM from 'react-dom';

interface AdminQueueModalProps {
  user: QueueEntry | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onDone: () => void;
  deleting: boolean;
  finishing: boolean;
  theme?: {
    bg?: string;
    text?: string;
    topBtnBg?: string;
    topBtnText?: string;
    bottomBtnBg?: string;
    bottomBtnText?: string;
  };
}

export default function AdminQueueModal({
  user,
  open,
  onClose,
  onDelete,
  onDone,
  deleting,
  finishing,
  theme,
}: AdminQueueModalProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !user || !mounted) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay}>
      <div
        className={styles.modal}
        style={{ background: theme?.bg, color: theme?.text }}
      >
        <div className={styles.userInfoRow}>
          <span className={styles.userName} style={{ color: theme?.text }}>
            {user.name}
          </span>
          <span className={styles.userStatus} style={{ color: theme?.text }}>
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
          style={{ background: theme?.topBtnBg, color: theme?.topBtnText }}
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
          style={{
            background: theme?.bottomBtnBg,
            color: theme?.bottomBtnText,
          }}
        >
          Закрыть
        </button>
      </div>
    </div>,
    document.body
  );
}
