import type { Metadata } from 'next';
import { Archivo, Hanken_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], variable: '--font-display', weight: ['600', '800'] });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body' });
const mono = Space_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'ROI Labs · Admin',
  robots: { index: false, follow: false },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'ROI Admin' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${hanken.variable} ${mono.variable}`}>
      <head>
        <script defer src="https://cdn.himetrica.com/tracker.js" data-api-key="hm_ff2a6a72cb6b63d54c8799d1dad7b24e4263b1e5882f872f"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
