import React, { useLayoutEffect, useRef, useState } from 'react';
import styles from './ConfirmDeleteModal.module.css';

type Anchor = { x: number; y: number };

type ConfirmDeleteModalProps = {
  open: boolean;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  anchor?: Anchor | null;
};

export default function ConfirmDeleteModal({
  open,
  message,
  confirmText = 'Удалить',
  cancelText = 'Оставить',
  onConfirm,
  onCancel,
  anchor,
}: ConfirmDeleteModalProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>(() =>
    anchor
      ? { position: 'fixed', top: anchor.y, left: anchor.x }
      : {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
  );

  useLayoutEffect(() => {
    const margin = 12;
    if (!anchor) {
      setStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const compute = () => {
      const box = boxRef.current;
      const boxRect = box?.getBoundingClientRect();
      const boxW = boxRect?.width ?? 280;
      const boxH = boxRect?.height ?? 140;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Use provided x (left edge of the card) and shift slightly left
      const horizontalOffset = 50; // tweak this to move more/less
      let x = anchor.x - horizontalOffset;
      let y = anchor.y; // initial below

      // If doesn't fit below, try above the anchor
      if (y + boxH > vh - margin) {
        y = Math.max(margin, anchor.y - boxH - 8);
      }

      // Clamp horizontally
      x = Math.min(Math.max(margin, x), vw - boxW - margin);

      setStyle({ position: 'fixed', top: y, left: x });
    };

    // Compute after next paint to ensure dimensions are known
    const id = window.requestAnimationFrame(compute);
    return () => window.cancelAnimationFrame(id);
  }, [anchor]);

  return open ? (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        ref={boxRef}
        className={styles.box}
        style={style}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.text}>{message}</div>
        <div className={styles.actions}>
          <button className={styles.deleteBtn} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
