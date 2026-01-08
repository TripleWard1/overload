import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Overload',
  applicationName: 'Overload',
  themeColor: '#070B14',
  appleWebApp: {
    title: 'Overload',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
