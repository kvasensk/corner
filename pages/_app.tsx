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

  const phrases = [
    'Оттягиваем кий...',
    'Натираем мелом...',
    'Протираем сукно...',
    'Выравниваем кий...',
    'Протираем шары...',
    'Наливаем кофе...',
    'Включаем свет...',
    'Включаем музыку...',
    'Целимся...',
    'Расставляем шары...',
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);

  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getPlatformConfig().then(setConfig);
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);

  useEffect(() => {
    if (config) return;
    const interval = setInterval(() => {
      setPhraseIdx(idx => (idx + 1) % phrases.length);
    }, 200);
    return () => clearInterval(interval);
  }, [config, phrases.length]);

  if (!config)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#1746d3',
        }}
      >
        <svg
          width='80'
          height='80'
          viewBox='0 0 80 80'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          style={{ animation: 'spin 1.2s linear infinite' }}
        >
          <circle
            cx='40'
            cy='40'
            r='36'
            fill='#222'
            stroke='#fff'
            strokeWidth='4'
          />
          <circle cx='40' cy='40' r='18' fill='#fff' />
          <text
            x='40'
            y='48'
            textAnchor='middle'
            fontSize='28'
            fontWeight='bold'
            fill='#222'
            fontFamily='Arial'
          >
            8
          </text>
        </svg>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div
          style={{
            color: '#fff',
            marginTop: 24,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: 1,
          }}
        >
          {phrases[phraseIdx]}
        </div>
      </div>
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
