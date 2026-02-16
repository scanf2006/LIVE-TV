import NewsFeed from '@/components/NewsFeed';

export default function Home() {
  return (
    <main className="container">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#1e40af', fontWeight: '700' }}>
          全球热点 (Global News)
        </h1>
        <p style={{ color: '#94a3b8' }}>
          汇聚全球主要媒体实时资讯
        </p>
      </div>

      <NewsFeed />
    </main>
  );
}
