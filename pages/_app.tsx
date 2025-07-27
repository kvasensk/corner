import type { AppProps } from 'next/app';
import '../src/styles/globals.css';
import styles from './page.module.css';
import { Quicksand } from 'next/font/google';
import React, { useEffect, useState } from 'react';
import { getPlatformConfig, PlatformConfig } from '../src/lib/firebase';
import Loader from '../src/uikit/Loader';
import { PlatformConfigProvider } from '../src/lib/PlatformConfigContext';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function MyApp({ Component, pageProps }: AppProps) {
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

  useEffect(() => {
    getPlatformConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (config) return;
    const interval = setInterval(() => {
      setPhraseIdx(idx => (idx + 1) % phrases.length);
    }, 200);
    return () => clearInterval(interval);
  }, [config, phrases.length]);

  if (!config) return <Loader text={phrases[phraseIdx]} />;

  return (
    <PlatformConfigProvider>
      <main className={quicksand.className}>
        <Component {...pageProps} />
      </main>
    </PlatformConfigProvider>
  );
}
