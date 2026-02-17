'use client';

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';
import { APICache } from '@/lib/cache';

export default function NewsFeed() {
    const [displayedNews, setDisplayedNews] = useState([]);
    const [reservePool, setReservePool] = useState([]);
    const [deletedIds, setDeletedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStatus, setCacheStatus] = useState(null);

    const INITIAL_DISPLAY_COUNT = 30; // 初始显示数量

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

        // 1. Filter and Process
        let validNews = newsData.filter(item => !storedDeletedIds.includes(item.id));

        // 2. 特殊处理微博: 跳过前3条 (Rank 1-3)
        //    我们需要先按源分离出微博，处理完后再合并
        const weiboItems = validNews.filter(item => item.source === '微博热搜');
        const otherItems = validNews.filter(item => item.source !== '微博热搜');

        let processedWeibo = weiboItems;
        if (processedWeibo.length > 3) {
            processedWeibo = processedWeibo.slice(3);
        } else if (processedWeibo.length > 0 && processedWeibo.length <= 3) {
            // 如果只有3条或更少，全丢弃？或者保留？
            // 假设是为了去掉置顶广告，通常前3是置顶。如果数据源本来就少，全丢弃可能导致空。
            // 这里严格执行规则：丢弃前3。
            processedWeibo = [];
        }

        // 3. 合并并排序 (时间倒序)
        let allItems = [...processedWeibo, ...otherItems];
        allItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // 4. 切分显示和备用
        setDisplayedNews(allItems.slice(0, INITIAL_DISPLAY_COUNT));
        setReservePool(allItems.slice(INITIAL_DISPLAY_COUNT));
    };

    const handleDeleteCard = (cardId) => {
        const newDeletedIds = [...deletedIds, cardId];
        setDeletedIds(newDeletedIds);
        localStorage.setItem('deletedNewsIds', JSON.stringify(newDeletedIds));

        setDisplayedNews(prev => {
            const filtered = prev.filter(item => item.id !== cardId);

            // 从备用池补充一条
            if (reservePool.length > 0) {
                const nextItem = reservePool[0];
                setReservePool(pool => pool.slice(1));
                return [...filtered, nextItem];
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
                            onDelete={() => handleDeleteCard(item.id)}
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
                    <span>v0.14.0</span>
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
