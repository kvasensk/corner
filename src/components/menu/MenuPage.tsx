import React, { useEffect, useState } from 'react';
import { getMenuItems } from '../../lib/firebase';
import type { MenuItem } from '../../types/menu';
import MenuSection from './MenuSection';
import styles from './MenuPage.module.css';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../public/assets/images/logo.png';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
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
        </div>
      </div>
      <div className={styles.main}>
        <MenuSection title='Кофе' items={coffee} showVolumeHeader />
        {specials.length > 0 && (
          <MenuSection title='Авторские напитки' items={specials} />
        )}
        {tea.length > 0 && <MenuSection title='Чай' items={tea} />}
      </div>
    </div>
  );
}
