import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import cornerLogo from '../public/assets/images/logo.png';
import styles from './page.module.css';

export default function MenuPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image
            src={cornerLogo}
            alt='Corner Coffee Spot Logo'
            width={112}
            height={63}
            className={styles.logoImage}
          />
        </div>
        <div className={styles.menu}>
          <button
            className={styles.menuInactive}
            type='button'
            onClick={() => router.push('/')}
          >
            Бильярд
          </button>
          <button
            className={styles.menuActive}
            type='button'
            onClick={() => router.push('/menu')}
          >
            Меню
          </button>
        </div>
      </div>
      <div className={styles.main}>
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',

            fontSize: '1.5rem',
          }}
        >
          <h2>Меню</h2>
          <p>Здесь скоро появятся напитки и еда!</p>
        </div>
      </div>
    </div>
  );
}
