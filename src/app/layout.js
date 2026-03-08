import './globals.css';

export const metadata = {
  title: 'Global News PWA',
  description: 'Real-time global news aggregator with translation.',
  manifest: '/manifest.json'
};

export const viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
