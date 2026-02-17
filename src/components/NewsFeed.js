'use client';

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';
import { APICache } from '@/lib/cache';

export default function NewsFeed() {
    // State to hold news grouped by source
    // Structure: { sourceName: { displayed: [], reserve: [] } }
    const [newsBySource, setNewsBySource] = useState({});
    const [deletedIds, setDeletedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStatus, setCacheStatus] = useState(null);

    const DISPLAY_PER_SOURCE = 5; // 每类显示5条
    const RESERVE_PER_SOURCE = 10; // 每类备用10条 (不够则全取)

    const fetchNews = async (forceRefresh = false) => {
        setLoading(true);

        try {
            // Check Cache
            if (!forceRefresh) {
                const cached = APICache.get('news');
                if (cached) {
                    initializeNewsLists(cached);
                    setLoading(false);
                    const cacheInfo = APICache.getInfo('news');
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
                APICache.set('news', data.data);
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

        // 1. Group all *valid* news by source
        const groups = {};

        newsData.forEach(item => {
            // Filter deleted
            if (storedDeletedIds.includes(item.id)) return;

            const source = item.source || 'Other';
            if (!groups[source]) {
                groups[source] = [];
            }
            groups[source].push(item);
        });

        // 2. Process each group (slice display and reserve)
        const processedGroups = {};

        Object.keys(groups).forEach(source => {
            let items = groups[source];

            // 特殊处理微博: 跳过前3条 (Rank 1-3)
            if (source === '微博热搜' && items.length > 3) {
                items = items.slice(3);
            }

            processedGroups[source] = {
                displayed: items.slice(0, DISPLAY_PER_SOURCE),
                reserve: items.slice(DISPLAY_PER_SOURCE, DISPLAY_PER_SOURCE + RESERVE_PER_SOURCE)
            };
        });

        setNewsBySource(processedGroups);
    };

    const handleDeleteCard = (cardId, source) => {
        const newDeletedIds = [...deletedIds, cardId];
        setDeletedIds(newDeletedIds);
        localStorage.setItem('deletedNewsIds', JSON.stringify(newDeletedIds));

        setNewsBySource(prev => {
            const sourceGroup = prev[source];
            if (!sourceGroup) return prev; // Should not happen

            // Remove from displayed
            const newDisplayed = sourceGroup.displayed.filter(item => item.id !== cardId);
            let newReserve = [...sourceGroup.reserve];

            // Refill from reserve if available
            if (newReserve.length > 0) {
                const nextItem = newReserve.shift(); // Take first from reserve
                newDisplayed.push(nextItem);
            }

            return {
                ...prev,
                [source]: {
                    displayed: newDisplayed,
                    reserve: newReserve
                }
            };
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

    // Priority order for sources
    const SOURCE_ORDER = ['微博热搜', 'X (Twitter)', 'YouTube'];

    // Sort sources: defined ones first, then others alphabetically
    const sortedSources = Object.keys(newsBySource).sort((a, b) => {
        const indexA = SOURCE_ORDER.indexOf(a);
        const indexB = SOURCE_ORDER.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return a.localeCompare(b);
    });

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

            {loading && Object.keys(newsBySource).length === 0 ? (
                <div className={styles.grid}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard}></div>
                    ))}
                </div>
            ) : (
                <div className={styles.groupedFeed}>
                    {sortedSources.map(source => {
                        const group = newsBySource[source];
                        if (!group || group.displayed.length === 0) return null;

                        return (
                            <div key={source} className={styles.sourceSection} style={{ marginBottom: '2rem' }}>
                                <h2 style={{
                                    padding: '0 1rem 1rem',
                                    margin: '0 0 1rem 0',
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    color: 'var(--foreground)',
                                    borderLeft: '4px solid #3b82f6',
                                    marginLeft: '1rem',
                                    lineHeight: '1.2'
                                }}>
                                    {source}
                                </h2>
                                <div className={styles.grid}>
                                    {group.displayed.map((item) => (
                                        <NewsCard
                                            key={item.id}
                                            item={item}
                                            onDelete={() => handleDeleteCard(item.id, source)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span>v0.12.0</span>
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
