import type { AppProps } from 'next/app';
import '../src/styles/globals.css';
import { Quicksand } from 'next/font/google';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getPlatformConfig, PlatformConfig } from '../src/lib/firebase';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  let activeTab: 'queue' | 'menu' | 'info' = 'queue';
  if (router.pathname === '/menu') activeTab = 'menu';
  if (router.pathname === '/info') activeTab = 'info';

  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getPlatformConfig().then(setConfig);
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);

  if (!config)
    return (
      <div style={{ color: '#7c1fa0', padding: 32 }}>Загрузка меню...</div>
    );

  // Не показываем клиентский бургер на странице /admin
  if (router.pathname.startsWith('/admin')) {
    return (
      <main className={quicksand.className}>
        <Component {...pageProps} />
      </main>
    );
  }

  return (
    <main className={quicksand.className}>
      <Component {...pageProps} />
    </main>
  );
}
