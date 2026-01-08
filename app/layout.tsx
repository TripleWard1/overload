import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overload',
  applicationName: 'Overload',
  appleWebApp: {
    title: 'Overload',
    statusBarStyle: 'black-translucent',
  },
  themeColor: '#070B14',
  icons: {
    icon: 'https://i.imgur.com/jROIhp2.png',
    apple: 'https://i.imgur.com/jROIhp2.png',
  },
};

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
