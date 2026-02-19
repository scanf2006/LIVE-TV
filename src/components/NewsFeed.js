'use client';

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';
import { APICache } from '@/lib/cache';

export default function NewsFeed() {
    const [displayedNews, setDisplayedNews] = useState([]);
    // Reserve pool is now an object: { 'Weibo': [], 'Twitter': [], ... }
    const [reservePool, setReservePool] = useState({});
    const [deletedIds, setDeletedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStatus, setCacheStatus] = useState(null);

    const DISPLAY_COUNT_PER_SOURCE = 5; // 每类显示5条
    const RESERVE_COUNT_PER_SOURCE = 10; // 每类备用10条

    const fetchNews = async (forceRefresh = false) => {
        setLoading(true);

        try {
            // Check Cache
            if (!forceRefresh) {
                const cached = APICache.get('news_v2');
                if (cached) {
                    initializeNewsLists(cached);
                    setLoading(false);
                    const cacheInfo = APICache.getInfo('news_v2');
                    if (cacheInfo) {
                        setCacheStatus({
                            fromCache: true,
                            age: Math.floor(cacheInfo.age / 1000),
                            remaining: Math.floor(cacheInfo.remaining / 1000)
                        });
                    }
                    return;
                }
            }

            const res = await fetch('/api/news');
            const data = await res.json();

            if (data.success) {
                initializeNewsLists(data.data);

                // Cache Data
                APICache.set('news_v2', data.data);
                setCacheStatus({
                    fromCache: false,
                    age: 0,
                    remaining: 600
                });
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const initializeNewsLists = (newsData) => {
        const storedDeletedIds = JSON.parse(localStorage.getItem('deletedNewsIds') || '[]');
        setDeletedIds(storedDeletedIds);

        // 1. Group by Source
        const groups = {};
        newsData.forEach(item => {
            if (storedDeletedIds.includes(item.id)) return;
            const source = item.source || 'Other';
            if (!groups[source]) groups[source] = [];
            groups[source].push(item);
        });

        // 2. Process Quotas
        let initialDisplay = [];
        const newReservePool = {};

        Object.keys(groups).forEach(source => {
            let items = groups[source];

            // Special handling for Weibo: skip top 3
            if (source === '微博热搜') {
                if (items.length > 3) {
                    items = items.slice(3);
                } else {
                    items = [];
                }
            }

            // Extract Quota
            const toDisplay = items.slice(0, DISPLAY_COUNT_PER_SOURCE);
            const toReserve = items.slice(DISPLAY_COUNT_PER_SOURCE, DISPLAY_COUNT_PER_SOURCE + RESERVE_COUNT_PER_SOURCE);

            initialDisplay = initialDisplay.concat(toDisplay);
            newReservePool[source] = toReserve;
        });

        // 3. Sort/Mix Display List (Time Descending)
        initialDisplay.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setDisplayedNews(initialDisplay);
        setReservePool(newReservePool);
    };

    const handleDeleteCard = (cardId, source) => {
        // 1. Update Deleted IDs
        const newDeletedIds = [...deletedIds, cardId];
        setDeletedIds(newDeletedIds);
        localStorage.setItem('deletedNewsIds', JSON.stringify(newDeletedIds));

        // 2. Prepare Replacement
        // Use current reservePool from closure (acceptable for UI action)
        let newItem = null;
        let newReservePoolState = { ...reservePool };
        const currentSourceReserve = newReservePoolState[source] || [];

        if (currentSourceReserve.length > 0) {
            newItem = currentSourceReserve[0];

            // Update Reserve Pool State
            newReservePoolState[source] = currentSourceReserve.slice(1);
            setReservePool(newReservePoolState);
        }

        // 3. Update Display List
        setDisplayedNews(prev => {
            const filtered = prev.filter(item => item.id !== cardId);
            if (newItem) {
                // Append replacement to end
                return [...filtered, newItem];
            }
            return filtered;
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchNews(true);
    };

    useEffect(() => {
        fetchNews();
        const interval = setInterval(() => {
            fetchNews(true);
        }, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Touch handling for pull-to-refresh
    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            const touch = e.touches[0];
            window.pullStartY = touch.clientY;
        }
    };

    const handleTouchMove = (e) => {
        if (window.pullStartY && window.scrollY === 0) {
            const touch = e.touches[0];
            const pullDistance = touch.clientY - window.pullStartY;
            if (pullDistance > 100 && !isRefreshing) {
                handleRefresh();
                window.pullStartY = null;
            }
        }
    };

    const handleTouchEnd = () => {
        window.pullStartY = null;
    };

    return (
        <div
            className={styles.feedContainer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {isRefreshing && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#3b82f6', fontSize: '0.875rem' }}>
                    🔄 正在刷新...
                </div>
            )}

            <div className={styles.grid}>
                {loading && displayedNews.length === 0 ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard}></div>
                    ))
                ) : (
                    displayedNews.map((item) => (
                        <NewsCard
                            key={item.id}
                            item={item}
                            // Pass source explicitly derived from item
                            onDelete={() => handleDeleteCard(item.id, item.source)}
                        />
                    ))
                )}

                {!loading && displayedNews.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        暂无数据
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span>v0.9.2</span>
                    <span>•</span>
                    <span>下拉刷新</span>
                    <span>•</span>
                    <span>左滑删除</span>
                    <span>•</span>
                    <span>{cacheStatus?.fromCache ? '📦 缓存' : '🆕 最新'}</span>
                </div>
            </footer>
        </div>
    );
}
