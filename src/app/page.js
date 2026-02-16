import NewsFeed from '@/components/NewsFeed';

export default function Home() {
  return (
    <>
      {/* 固定标题容器 - 完全对齐grid */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingTop: '1.5rem',
        pointerEvents: 'none'
      }}>
        {/* 与grid完全相同的布局 */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
          pointerEvents: 'none',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* 圆角透明玻璃方块 */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '1.25rem',
            padding: '1.25rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(255, 255, 255, 0.2)',
            pointerEvents: 'auto',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            {/* 顶部光泽线 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
              opacity: 0.6
            }}></div>

            <h1 style={{
              fontSize: '1.5rem',
              margin: 0,
              color: '#1e40af',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              position: 'relative'
            }}>
              🌐 全球热点
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '0.75rem',
              margin: '0.25rem 0 0',
              fontWeight: '500',
              position: 'relative'
            }}>
              汇聚全球主要媒体实时资讯
            </p>
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <main style={{ paddingTop: '7rem' }}>
        <NewsFeed />
      </main>
    </>
  );
}
