import NewsFeed from '@/components/NewsFeed';

export default function Home() {
  return (
    <main>
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#1e40af', fontWeight: '700' }}>
          🌐 全球热点
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          汇聚全球主要媒体实时资讯
        </p>
      </div>
      <NewsFeed />
    </main>
  );
}
