'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/iptv');
        const data = await response.json();

        if (data.success) {
          setChannels(data.data);
          setFilteredChannels(data.data);

          // 提取所有分类并去重/排序
          const cats = ['All', ...new Set(data.data.map(c => c.category).filter(Boolean))].sort();
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

  // 执行分类过滤
  useEffect(() => {
    if (currentCategory === 'All') {
      setFilteredChannels(channels);
    } else {
      setFilteredChannels(channels.filter(c => c.category === currentCategory));
    }
  }, [currentCategory, channels]);

  // 遥控器空间导航 (Spatial Navigation) 支持
  useEffect(() => {
    let SpatialNavigation;
    let focusTimer;

    import('spatial-navigation-js').then((mod) => {
      SpatialNavigation = mod.default || mod;
      SpatialNavigation.init();
      SpatialNavigation.add({
        selector: `.${styles.tab}, .${styles.card}`
      });
      SpatialNavigation.makeFocusable();

      // 尝试默认聚焦第一个元素
      focusTimer = setTimeout(() => {
        const firstFocusable = document.querySelector(`.${styles.tab}, .${styles.card}`);
        if (firstFocusable && document.activeElement === document.body) {
          firstFocusable.focus();
        }
      }, 500);
    }).catch(err => console.error("Failed to load SpatialNavigation:", err));

    const handleKeyDown = (e) => {
      const key = e.key;
      // 保留 F 键全屏功能
      if (key === 'f' || key === 'F' || key === 'MediaPlayPause') {
        const video = document.querySelector('video');
        if (video) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen().catch(err => console.error(err));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (SpatialNavigation) {
        SpatialNavigation.uninit();
      }
      clearTimeout(focusTimer);
    };
  }, [channels, categories, currentCategory]);

  return (
    <main className={`${styles.container} ${styles.fadeIn}`}>
      {/* 全局背景氛围 */}
      <div className={styles.ambientLight} />

      <div className={styles.content}>
        <div style={{ marginBottom: '3rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: 900 }}>
            Live Canada
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
            Premium Live Streams • <span style={{ color: 'var(--tv-primary)' }}>{channels.length} Channels Verified</span>
          </p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>正在高速扫描并精选 60 个高清无广告源...</p>
          </div>
        ) : error ? (
          <div className={styles.loading} style={{ color: '#ff4d4d' }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '0.8rem 2rem', background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer' }}
            >
              重新重试
            </button>
          </div>
        ) : (
          <>
            <IPTVPlayer channel={currentChannel} />

            {/* 分类 Tabs 导航 */}
            <div className={styles.tabs} role="tablist">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.tab} ${currentCategory === cat ? styles.tabActive : ''}`}
                  onClick={() => setCurrentCategory(cat)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setCurrentCategory(cat);
                  }}
                  tabIndex="0"
                >
                  {cat || 'General'}
                </button>
              ))}
            </div>

            <ChannelGrid
              channels={filteredChannels}
              onSelect={setCurrentChannel}
              currentId={currentChannel?.id}
            />
          </>
        )}
      </div>

      <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        <p>© 2026 Global News PWA - Canada IPTV Edition</p>
        <p>资源来源于开源社区，仅供学习交流</p>
      </footer>
    </main>
  );
}
