'use client';

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';
import { APICache } from '@/lib/cache';

export default function NewsFeed() {
    const [allNews, setAllNews] = useState([]); // 所有新闻
    const [displayedNews, setDisplayedNews] = useState([]); // 显示的新闻
    const [reservePool, setReservePool] = useState([]); // 备用池
    const [deletedIds, setDeletedIds] = useState([]); // 已删除的卡片ID
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStatus, setCacheStatus] = useState(null);


    const INITIAL_DISPLAY_COUNT = 12; // 初始显示12条,备选池更多

    const fetchNews = async (forceRefresh = false) => {
        setLoading(true);

        try {
            // 检查缓存(除非强制刷新)
            if (!forceRefresh) {
                const cached = APICache.get('news');
                if (cached) {
                    initializeNewsLists(cached);
                    setLoading(false);

                    // 获取缓存信息
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

            // 请求API
            const res = await fetch('/api/news');
            const data = await res.json();

            if (data.success) {
                initializeNewsLists(data.data);
                setLastUpdated(new Date());

                // 缓存数据
                APICache.set('news', data.data);

                // 更新缓存状态
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

    // 初始化显示列表和备用池
    const initializeNewsLists = (newsData) => {
        // 从localStorage读取已删除的ID
        const storedDeletedIds = JSON.parse(localStorage.getItem('deletedNewsIds') || '[]');
        setDeletedIds(storedDeletedIds);

        // 过滤掉已删除的新闻
        const filteredNews = newsData.filter(item => !storedDeletedIds.includes(item.id));

        setAllNews(filteredNews);
        setDisplayedNews(filteredNews.slice(0, INITIAL_DISPLAY_COUNT));
        setReservePool(filteredNews.slice(INITIAL_DISPLAY_COUNT));
    };

    // 删除卡片并补充新卡片
    const handleDeleteCard = (cardId) => {
        // 更新deletedIds并保存到localStorage
        const newDeletedIds = [...deletedIds, cardId];
        setDeletedIds(newDeletedIds);
        localStorage.setItem('deletedNewsIds', JSON.stringify(newDeletedIds));

        setDisplayedNews(prev => {
            const filtered = prev.filter(item => item.id !== cardId);

            // 从备用池取一条补充
            if (reservePool.length > 0) {
                const newCard = reservePool[0];
                setReservePool(pool => pool.slice(1));
                return [...filtered, newCard];
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

        // 每10分钟自动刷新
        const interval = setInterval(() => {
            fetchNews(true);
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // 下拉刷新处理
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
            {/* 刷新指示器 */}
            {isRefreshing && (
                <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    color: '#3b82f6',
                    fontSize: '0.875rem'
                }}>
                    🔄 正在刷新...
                </div>
            )}

            {/* News Grid */}
            <div className={styles.grid}>
                {loading && displayedNews.length === 0 ? (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard}></div>
                        ))}
                    </>
                ) : (
                    displayedNews.map((item) => (
                        <NewsCard
                            key={item.id}
                            item={item}
                            onDelete={handleDeleteCard}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span>v0.10.1</span>
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
