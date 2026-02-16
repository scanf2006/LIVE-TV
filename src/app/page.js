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
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {/* 圆角透明玻璃方块 - 与卡片同宽 */}
        <header style={{
          width: '100%',
          maxWidth: 'calc(1400px + 3rem)',
          padding: '0 1.5rem',
          pointerEvents: 'none'
        }}>
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
            overflow: 'hidden'
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
        </header>
      </div>

      {/* 可滚动内容区域 */}
      <main style={{ paddingTop: '7rem' }}>
        <NewsFeed />
      </main>
    </>
  );
}
