import NewsFeed from '@/components/NewsFeed';

export default function Home() {
  return (
    <>
      {/* 固定标题 - Apple风格 */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '1.5rem 1.5rem 1rem',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)'
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          margin: 0,
          color: '#1e40af',
          fontWeight: '700',
          letterSpacing: '-0.5px'
        }}>
          🌐 全球热点
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: '0.75rem',
          margin: '0.25rem 0 0',
          fontWeight: '500'
        }}>
          汇聚全球主要媒体实时资讯
        </p>
      </header>

      {/* 可滚动内容区域 */}
      <main style={{ paddingTop: '6rem' }}>
        <NewsFeed />
      </main>
    </>
  );
}
