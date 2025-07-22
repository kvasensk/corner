import './globals.css';
import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata = {
  title: 'Billiard Queue',
  description: 'Очередь на бильярд и Hello Kitty вайб!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ru'>
      <body className={quicksand.className}>{children}</body>
    </html>
  );
}
