import NewsFeed from '@/components/NewsFeed';

export default function Home() {
  return (
    <>
      {/* 固定标题容器 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '1.5rem',
        pointerEvents: 'none'
      }}>
        {/* 圆角透明玻璃方块 */}
        <header style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '1.5rem',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
          pointerEvents: 'auto'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
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
      </div>

      {/* 可滚动内容区域 */}
      <main style={{ paddingTop: '7rem' }}>
        <NewsFeed />
      </main>
    </>
  );
}
