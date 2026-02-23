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

  const currentChannelRef = useRef(null);
  const filteredChannelsRef = useRef([]);

  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  useEffect(() => {
    filteredChannelsRef.current = filteredChannels;
  }, [filteredChannels]);

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

  // 遥控器原生空间导航 (替代第三方包避免 SSR 报错)
  useEffect(() => {
    // 尝试默认聚焦第一个元素
    const focusTimer = setTimeout(() => {
      const firstFocusable = document.querySelector(`.${styles.tab}, .${styles.card}`);
      if (firstFocusable && (!document.activeElement || document.activeElement === document.body)) {
        firstFocusable.focus();
      }
    }, 500);

    const handleKeyDown = (e) => {
      const key = e.key;

      // 防止 Back 键直接退出 PWA (Fire TV 物理返回键映射为 Backspace 或 Escape)
      if (key === 'Escape' || key === 'Backspace' || key === 'GoBack') {
        if (document.fullscreenElement) {
          e.preventDefault();
          document.exitFullscreen();
          return;
        }
        // 非全屏下点击返回，如果当前有卡片聚焦，不做额外拦截，允许系统处理
      }

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
        return;
      }

      // 沉浸式全屏状态下：按上下键无缝切台
      if (document.fullscreenElement) {
        if (key === 'ArrowUp' || key === 'ArrowDown') {
          e.preventDefault();
          const channel = currentChannelRef.current;
          const list = filteredChannelsRef.current;

          if (!channel || list.length === 0) return;

          const currentIndex = list.findIndex(c => c.id === channel.id);
          if (currentIndex === -1) return;

          let nextIndex = currentIndex;
          if (key === 'ArrowDown') { // 下一台
            nextIndex = (currentIndex + 1) % list.length;
          } else { // 上一台
            nextIndex = (currentIndex - 1 + list.length) % list.length;
          }

          setCurrentChannel(list[nextIndex]);
        }
        return;
      }

      // 方向键导航
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        const focusables = Array.from(document.querySelectorAll(`.${styles.tab}, .${styles.card}`));
        const current = document.activeElement;

        // 如果当前没有聚焦在任何交互组件上，默认聚焦首个频道
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

          // 使用多维度距离加权算法 (中心点优先)
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
          // 电视端神技：平滑滚动到屏幕中心以保持视野最优
          bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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
            Global Premium TV
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
            Curated UK/US/CA Streams • <span style={{ color: 'var(--tv-primary)' }}>{channels.length} Premium Channels Verified</span>
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
