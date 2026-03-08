'use client';

import { useState, useEffect, useCallback } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';
import { APICache } from '@/lib/cache';

const DISPLAY_COUNT_PER_SOURCE = 5;
const RESERVE_COUNT_PER_SOURCE = 10;

export default function NewsFeed() {
    const [displayedNews, setDisplayedNews] = useState([]);
    const [reservePool, setReservePool] = useState({});
    const [deletedIds, setDeletedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStatus, setCacheStatus] = useState(null);

    const initializeNewsLists = useCallback((newsData) => {
        const storedDeletedIds = JSON.parse(localStorage.getItem('deletedNewsIds') || '[]');
        setDeletedIds(storedDeletedIds);

        const groups = {};
        newsData.forEach((item) => {
            if (storedDeletedIds.includes(item.id)) return;
            const source = item.source || 'Other';
            if (!groups[source]) groups[source] = [];
            groups[source].push(item);
        });

        let initialDisplay = [];
        const newReservePool = {};

        Object.keys(groups).forEach((source) => {
            let items = groups[source];

            if (source === '微博热搜') {
                items = items.length > 3 ? items.slice(3) : [];
            }

            const toDisplay = items.slice(0, DISPLAY_COUNT_PER_SOURCE);
            const toReserve = items.slice(DISPLAY_COUNT_PER_SOURCE, DISPLAY_COUNT_PER_SOURCE + RESERVE_COUNT_PER_SOURCE);

            initialDisplay = initialDisplay.concat(toDisplay);
            newReservePool[source] = toReserve;
        });

        initialDisplay.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setDisplayedNews(initialDisplay);
        setReservePool(newReservePool);
    }, []);

    const fetchNews = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        try {
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
                APICache.set('news_v2', data.data);
                setCacheStatus({ fromCache: false, age: 0, remaining: 600 });
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [initializeNewsLists]);

    const handleDeleteCard = (cardId, source) => {
        const newDeletedIds = [...deletedIds, cardId];
        setDeletedIds(newDeletedIds);
        localStorage.setItem('deletedNewsIds', JSON.stringify(newDeletedIds));

        let newItem = null;
        const newReservePoolState = { ...reservePool };
        const currentSourceReserve = newReservePoolState[source] || [];

        if (currentSourceReserve.length > 0) {
            newItem = currentSourceReserve[0];
            newReservePoolState[source] = currentSourceReserve.slice(1);
            setReservePool(newReservePoolState);
        }

        setDisplayedNews((prev) => {
            const filtered = prev.filter((item) => item.id !== cardId);
            return newItem ? [...filtered, newItem] : filtered;
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
    }, [fetchNews]);

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
                    Refreshing...
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
                            onDelete={() => handleDeleteCard(item.id, item.source)}
                        />
                    ))
                )}

                {!loading && displayedNews.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No data available
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span>v0.9.3</span>
                    <span>|</span>
                    <span>Pull to refresh</span>
                    <span>|</span>
                    <span>Swipe left to delete</span>
                    <span>|</span>
                    <span>{cacheStatus?.fromCache ? 'Cached' : 'Live'}</span>
                </div>
            </footer>
        </div>
    );
}
