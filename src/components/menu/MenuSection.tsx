import React from 'react';
import type { MenuItem } from '../../types/menu';
import styles from './MenuSection.module.css';

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  showVolumeHeader?: boolean;
}

export default function MenuSection({
  title,
  items,
  showVolumeHeader,
}: MenuSectionProps) {
  if (!items.length) return null;
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {showVolumeHeader && (
          <div className={styles.volumeHeader}>
            <span>0,2</span>
            <span>0,3</span>
          </div>
        )}
      </div>
      <div className={styles.items}>
        {items.map(item => (
          <div key={item.id} className={styles.itemRow}>
            <span>{item.name}</span>
            <div className={styles.itemPrices}>
              <span>{item.price02 || '-'}</span>
              <span>{item.price03 || '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
