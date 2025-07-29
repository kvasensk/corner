import React, { useEffect, useState } from 'react';
import { getMenuItems } from '../../lib/firebase';
import type { MenuItem } from '../../types/menu';
import MenuSection from './MenuSection';
import styles from './MenuPage.module.css';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../public/assets/images/logo.png';
import { db } from '../../lib/firebase';
import { writeBatch, doc } from 'firebase/firestore';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editMode, setEditMode] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);
  useEffect(() => {
    getMenuItems().then(rawItems => {
      setItems(
        (rawItems as Partial<MenuItem>[]).map(item => ({
          id: item.id || '',
          name: item.name || '',
          description: item.description || '',
          picture: item.picture || '',
          price: item.price || '',
          price02: item.price02 || '',
          price03: item.price03 || '',
          type: item.type || '',
          section: item.section || '',
        }))
      );
    });
  }, []);

  const coffee = items.filter(item => item.section?.toLowerCase() === 'coffee');
  const specials = items.filter(
    item => item.section?.toLowerCase() === 'authors'
  );
  const tea = items.filter(item => item.section?.toLowerCase() === 'tea');

  async function handleReorder(section: string, newItems: MenuItem[]) {
    // Проставляем новый order
    const withOrder = newItems.map((item, idx) => ({ ...item, order: idx }));
    // Обновляем Firestore
    const batch = writeBatch(db);
    withOrder.forEach(item => {
      batch.update(doc(db, 'menu', 'items', 'items', item.id), {
        order: item.order,
      });
    });
    await batch.commit();
    // Обновляем локально
    setItems(prev =>
      prev.map(i => {
        const found = withOrder.find(x => x.id === i.id);
        return found ? { ...i, order: found.order } : i;
      })
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image
            src={logo}
            alt='Corner Coffee Spot Logo'
            width={112}
            height={63}
          />
        </div>
        <div className={styles.menu}>
          <Link href='/' className={styles.menuActive}>
            Очередь
          </Link>
          {isAdmin && (
            <button
              className={styles.editBtn}
              onClick={() => setEditMode(m => !m)}
            >
              {editMode ? 'Готово' : 'Передвинуть'}
            </button>
          )}
        </div>
      </div>
      <div className={styles.main}>
        <MenuSection
          title='Кофе'
          items={coffee.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
          showVolumeHeader
          editable={editMode}
          onReorder={newItems => handleReorder('coffee', newItems)}
        />
        {specials.length > 0 && (
          <MenuSection
            title='Авторские напитки'
            items={specials.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
            editable={editMode}
            onReorder={newItems => handleReorder('authors', newItems)}
          />
        )}
        {tea.length > 0 && (
          <MenuSection
            title='Чай'
            items={tea.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
            editable={editMode}
            onReorder={newItems => handleReorder('tea', newItems)}
          />
        )}
      </div>
    </div>
  );
}
