import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Overload',
  applicationName: 'Overload',

  appleWebApp: {
    title: 'Overload',
    statusBarStyle: 'black-translucent',
  },

  themeColor: '#070B14',

  icons: {
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}; // ✅ ISTO FALTAVA

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
