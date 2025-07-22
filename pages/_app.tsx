import type { AppProps } from 'next/app';
import '../src/styles/globals.css';
import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={quicksand.className}>
      <Component {...pageProps} />
    </main>
  );
}
