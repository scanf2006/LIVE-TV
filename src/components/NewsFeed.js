'use client';

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';
import { APICache } from '@/lib/cache';

export default function NewsFeed() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cacheStatus, setCacheStatus] = useState(null);

    const fetchNews = async (forceRefresh = false) => {
        setLoading(true);

        try {
            // 检查缓存(除非强制刷新)
            if (!forceRefresh) {
                const cached = APICache.get('news');
                if (cached) {
                    setNews(cached);
                    setLoading(false);

                    // 获取缓存信息
                    const cacheInfo = APICache.getInfo('news');
                    if (cacheInfo) {
                        setCacheStatus({
                            fromCache: true,
                            age: Math.floor(cacheInfo.age / 1000), // 转换为秒
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
                setNews(data.data);
                setLastUpdated(new Date());

                // 缓存数据
                APICache.set('news', data.data);

                // 更新缓存状态
                setCacheStatus({
                    fromCache: false,
                    age: 0,
                    remaining: 600 // 10分钟
                });
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchNews(true); // 强制刷新
    };

    useEffect(() => {
        fetchNews();

        // 每10分钟自动刷新
        const interval = setInterval(() => {
            fetchNews(true);
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.feedContainer}>
            {/* Top Navigation Bar */}
            <nav className={styles.navbar}>
                <div className={styles.navContent}>
                    <div className={styles.brandSection}>
                        <span className={styles.logo}>🌐</span>
                        <h1 className={styles.appName}>全球热点</h1>
                    </div>
                    <div className={styles.navActions}>
                        <button
                            onClick={handleRefresh}
                            className={styles.refreshButton}
                            disabled={isRefreshing}
                            title="刷新新闻"
                        >
                            {isRefreshing ? '🔄' : '↻'}
                        </button>
                        {cacheStatus && (
                            <span className={styles.cacheStatus} title={`缓存年龄: ${cacheStatus.age}秒`}>
                                {cacheStatus.fromCache ? '📦' : '🆕'}
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            {/* News Grid */}
            <div className={styles.grid}>
                {loading && news.length === 0 ? (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard}></div>
                        ))}
                    </>
                ) : (
                    news.map((item) => (
                        <NewsCard key={item.id} news={item} />
                    ))
                )}
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span>v0.9.1</span>
                    <span>全球热点新闻聚合</span>
                </div>
            </footer>
        </div>
    );
}
