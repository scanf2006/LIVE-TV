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
            <div className={styles.header}>
                <h2 className="text-gradient">全球热搜 (Global Trends)</h2>
                <div className={styles.controls}>
                    {lastUpdated && <span className={styles.lastUpdated}>更新于: {lastUpdated.toLocaleTimeString()}</span>}
                    <button onClick={fetchNews} className={styles.refreshBtn} disabled={loading}>
                        {loading ? '刷新中...' : '刷新'}
                    </button>
                </div>
            </div>

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
            {/* Version Footer */}
            <div className={styles.footer}>
                v0.1.0
            </div>
        </div>
    );
}
