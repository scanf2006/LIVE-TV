'use client';

import React, { useState, useEffect, useRef } from 'react';
import IPTVPlayer from '@/components/IPTVPlayer';
import ChannelGrid from '@/components/ChannelGrid';
import styles from '@/components/IPTV.module.css';


export default function Home() {
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [currentCategory, setCurrentCategory] = useState('All');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 分页与收藏状态
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const itemsPerPage = 50;

  const currentChannelRef = useRef(null);
  const filteredChannelsRef = useRef([]);

  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  useEffect(() => {
    filteredChannelsRef.current = filteredChannels;
  }, [filteredChannels]);

  // 初始化加载数据
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        // 加载收藏夹
        const savedFavs = localStorage.getItem('iptv_favorites');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        const response = await fetch('/api/iptv');
        const data = await response.json();

        if (data.success) {
          setChannels(data.data);

          // 提取所有分类
          const cats = ['All', 'Favorites', ...new Set(data.data.map(c => c.category).filter(Boolean))].sort();
          setCategories(cats);

          if (data.data.length > 0) {
            setCurrentChannel(data.data[0]);
          }
        } else {
          setError(`加载结果异常: ${data.message || '未知错误'}`);
        }
      } catch (err) {
        console.error('Fetch error details:', err);
        setError(`无法连接到服务器 (${err.message})。请确保您已在终端启动了项目服务。`);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  // 执行分类过滤、收藏置顶排序，并重置页码
  useEffect(() => {
    setCurrentPage(1);
    let result = [];

    if (currentCategory === 'Favorites') {
      result = channels.filter(c => favorites.includes(c.id));
    } else if (currentCategory === 'All') {
      result = [...channels];
    } else {
      result = channels.filter(c => c.category === currentCategory);
    }

    // 在任何分类下（除 Favorites 本身外），将已收藏频道置顶
    if (currentCategory !== 'Favorites') {
      result.sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
      });
    }

    setFilteredChannels(result);
  }, [currentCategory, channels, favorites]);

  // 收藏切换逻辑
  const toggleFavorite = (channelId) => {
    setFavorites(prev => {
      const next = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem('iptv_favorites', JSON.stringify(next));
      return next;
    });
  };

  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage);
  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 遥控器原生空间导航
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      const firstFocusable = document.querySelector(`.${styles.tab}, .${styles.card}, .${styles.pageButton}, .${styles.favoriteBtn}`);
      if (firstFocusable && (!document.activeElement || document.activeElement === document.body)) {
        firstFocusable.focus();
      }
    }, 500);

    const handleKeyDown = (e) => {
      const key = e.key;

      if (key === 'Escape' || key === 'Backspace' || key === 'GoBack') {
        if (document.fullscreenElement) {
          e.preventDefault();
          document.exitFullscreen();
          return;
        }
      }

      if (key === 'f' || key === 'F' || key === 'MediaPlayPause') {
        const video = document.querySelector('video');
        if (video) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen().catch(err => console.error(err));
          }
        }
        return;
      }

      if (document.fullscreenElement) {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          e.preventDefault();
          const channel = currentChannelRef.current;
          const list = filteredChannelsRef.current;
          if (!channel || list.length === 0) return;
          const currentIndex = list.findIndex(c => c.id === channel.id);
          if (currentIndex === -1) return;
          let nextIndex = (key === 'ArrowDown') ? (currentIndex + 1) % list.length : (currentIndex - 1 + list.length) % list.length;
          setCurrentChannel(list[nextIndex]);
        }
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        const focusables = Array.from(document.querySelectorAll(`.${styles.tab}, .${styles.card}, .${styles.pageButton}, .${styles.favoriteBtn}`));
        const current = document.activeElement;

        if (!focusables.includes(current)) {
          const firstCard = document.querySelector(`.${styles.card}`);
          if (firstCard) firstCard.focus();
          return;
        }

        const currentRect = current.getBoundingClientRect();
        let bestCandidate = null;
        let minDistance = Infinity;

        focusables.forEach(node => {
          if (node === current) return;
          const rect = node.getBoundingClientRect();
          let isEligible = false;
          let distance = 0;

          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const curCenterX = currentRect.left + currentRect.width / 2;
          const curCenterY = currentRect.top + currentRect.height / 2;

          if (key === 'ArrowRight' && rect.left >= currentRect.right - 10) {
            isEligible = true;
            distance = Math.pow(rect.left - currentRect.right, 2) + Math.pow(centerY - curCenterY, 2) * 4;
          } else if (key === 'ArrowLeft' && rect.right <= currentRect.left + 10) {
            isEligible = true;
            distance = Math.pow(currentRect.left - rect.right, 2) + Math.pow(centerY - curCenterY, 2) * 4;
          } else if (key === 'ArrowDown' && rect.top >= currentRect.bottom - 10) {
            isEligible = true;
            distance = Math.pow(rect.top - currentRect.bottom, 2) + Math.pow(centerX - curCenterX, 2) * 5;
          } else if (key === 'ArrowUp' && rect.bottom <= currentRect.top + 10) {
            isEligible = true;
            distance = Math.pow(currentRect.top - rect.bottom, 2) + Math.pow(centerX - curCenterX, 2) * 5;
          }

          if (isEligible && distance < minDistance) {
            minDistance = distance;
            bestCandidate = node;
          }
        });

        if (bestCandidate) {
          bestCandidate.focus();
          bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [channels, categories, currentCategory, currentPage, favorites]);

  return (
    <main className={`${styles.container} ${styles.fadeIn}`}>
      <div className={styles.ambientLight} />

      <div className={styles.content}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: 900 }}>
            Global Premium TV
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
            Curated World Streams • <span style={{ color: 'var(--tv-primary)' }}>{channels.length} Premium Channels Verified</span>
          </p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>正在同步全球 15 个优质源并执行品牌级去重...</p>
          </div>
        ) : error ? (
          <div className={styles.loading} style={{ color: '#ff4d4d' }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.8rem 2rem', background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius)', color: 'white' }}>重新重试</button>
          </div>
        ) : (
          <>
            <IPTVPlayer channel={currentChannel} />

            <div className={styles.tabs} role="tablist">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.tab} ${currentCategory === cat ? styles.tabActive : ''}`}
                  onClick={() => setCurrentCategory(cat)}
                  tabIndex="0"
                >
                  {cat === 'Favorites' ? `❤️ ${cat}` : (cat || 'General')}
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <button className={styles.pageButton} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>上一页</button>
                <div className={styles.pageInfo}>第 {currentPage} / {totalPages} 页</div>
                <button className={styles.pageButton} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>下一页</button>
              </div>
            )}

            <ChannelGrid
              channels={paginatedChannels}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onSelect={setCurrentChannel}
              currentId={currentChannel?.id}
            />

            {totalPages > 1 && (
              <div className={styles.paginationContainer} style={{ marginTop: '5rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`${styles.pageButton} ${currentPage === page ? styles.pageButtonActive : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        <p>© 2026 Global News PWA - World Premium Edition</p>
      </footer>
    </main>
  );
}
