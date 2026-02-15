'use client';

import { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import styles from './NewsFeed.module.css';

export default function NewsFeed() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/news');
            const data = await res.json();
            if (data.success) {
                setNews(data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();

        // Auto-refresh every hour (3600000 ms)
        const interval = setInterval(fetchNews, 3600000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.feedContainer}>
            {/* Top Navigation Bar */}
            <nav className={styles.navbar}>
                <div className={styles.navContent}>
                    <div className={styles.brand}>
                        <span className={styles.logo}>🌐</span>
                        <h1 className={styles.appName}>Global News</h1>
                    </div>
                    <div className={styles.navActions}>
                        {lastUpdated && (
                            <span className={styles.lastUpdated}>
                                更新于: {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button onClick={fetchNews} className={styles.refreshBtn} disabled={loading}>
                            <span className={styles.refreshIcon}>↻</span>
                            {loading ? '刷新中...' : '刷新'}
                        </button>
                    </div>
                </div>
            </nav>

            {/* News Grid */}
            {loading && news.length === 0 ? (
                <div className={styles.grid}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard}></div>
                    ))}
                </div>
            ) : (
                <div className={styles.grid}>
                    {news.map(item => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <span>v0.6.3</span>
                    <span className={styles.separator}>•</span>
                    <span>全球热点新闻聚合</span>
                </div>
            </footer>
        </div>
    );
}
