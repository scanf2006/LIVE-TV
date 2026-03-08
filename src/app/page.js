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

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);

        const savedFavs = localStorage.getItem('iptv_favorites');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        const response = await fetch('/api/iptv');
        const data = await response.json();

        if (!data.success) {
          setError(`Load failed: ${data.message || 'Unknown error'}`);
          return;
        }

        setChannels(data.data);
        const cats = ['All', 'Favorites', ...new Set(data.data.map((c) => c.category).filter(Boolean))].sort();
        setCategories(cats);

        if (data.data.length > 0) {
          setCurrentChannel(data.data[0]);
        }
      } catch (err) {
        setError(`Cannot reach server: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  useEffect(() => {
    setCurrentPage(1);

    let result = [];
    if (currentCategory === 'Favorites') {
      result = channels.filter((c) => favorites.includes(c.id));
    } else if (currentCategory === 'All') {
      result = [...channels];
    } else {
      result = channels.filter((c) => c.category === currentCategory);
    }

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

  const toggleFavorite = (channelId) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
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

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      const firstFocusable = document.querySelector('[data-focusable="true"]');
      if (firstFocusable && (!document.activeElement || document.activeElement === document.body)) {
        firstFocusable.focus();
      }
    }, 300);

    const handleKeyDown = (e) => {
      const key = e.key;

      if (key === 'Escape' || key === 'Backspace' || key === 'GoBack') {
        if (document.fullscreenElement) {
          e.preventDefault();
          document.exitFullscreen();
        }
        return;
      }

      if (key === 'f' || key === 'F' || key === 'MediaPlayPause') {
        const video = document.querySelector('video');
        if (video) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            video.requestFullscreen().catch(() => {});
          }
        }
        return;
      }

      if (document.fullscreenElement && (key === 'ArrowUp' || key === 'ArrowDown')) {
        e.preventDefault();
        const channel = currentChannelRef.current;
        const list = filteredChannelsRef.current;
        if (!channel || list.length === 0) return;

        const currentIndex = list.findIndex((c) => c.id === channel.id);
        if (currentIndex < 0) return;

        const nextIndex = key === 'ArrowDown'
          ? (currentIndex + 1) % list.length
          : (currentIndex - 1 + list.length) % list.length;

        setCurrentChannel(list[nextIndex]);
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      e.preventDefault();
      const focusables = Array.from(document.querySelectorAll('[data-focusable="true"]'));
      const current = document.activeElement;

      if (!focusables.includes(current)) {
        focusables[0]?.focus();
        return;
      }

      const currentRect = current.getBoundingClientRect();
      let bestCandidate = null;
      let minDistance = Infinity;

      focusables.forEach((node) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [currentPage, currentCategory, favorites]);

  return (
    <main className={`${styles.container} ${styles.fadeIn}`}>
      <div className={styles.ambientLight} />
      <div className={styles.content}>
        <header className={styles.heroHeader}>
          <div>
            <h1 className={styles.heroTitle}>CineStream TV</h1>
            <p className={styles.heroSubtitle}>
              Lean-back live TV experience for remote navigation
            </p>
          </div>
          <div className={styles.heroMeta}>
            <span>{channels.length} channels</span>
            <span>{favorites.length} favorites</span>
          </div>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading channels and validating streams...</p>
          </div>
        ) : error ? (
          <div className={styles.loading} style={{ color: '#ff6b6b' }}>
            <p>{error}</p>
            <button
              className={styles.pageButton}
              data-focusable="true"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <IPTVPlayer channel={currentChannel} />

            <div className={styles.tabs} role="tablist" aria-label="Channel categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.tab} ${currentCategory === cat ? styles.tabActive : ''}`}
                  onClick={() => setCurrentCategory(cat)}
                  data-focusable="true"
                >
                  {cat === 'Favorites' ? `Favorites (${favorites.length})` : (cat || 'General')}
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <button
                  className={styles.pageButton}
                  data-focusable="true"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <div className={styles.pageInfo}>Page {currentPage} / {totalPages}</div>
                <button
                  className={styles.pageButton}
                  data-focusable="true"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}

            <ChannelGrid
              channels={paginatedChannels}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onSelect={setCurrentChannel}
              currentId={currentChannel?.id}
            />

            <div className={styles.remoteHint}>
              <span>Use D-pad to move</span>
              <span>OK to play</span>
              <span>Long press OK to favorite</span>
              <span>Back to exit fullscreen</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
