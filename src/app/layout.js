import './globals.css';

export const metadata = {
  title: 'Global News PWA',
  description: 'Real-time global news aggregator with translation.',
  manifest: '/manifest.json',
  themeColor: '#121212',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
