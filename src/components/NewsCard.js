import styles from './NewsCard.module.css';

const getSourceStyle = (source) => {
    if (source.includes('Reddit')) return styles.sourceReddit;
    if (source.includes('Twitter') || source.includes('X')) return styles.sourceTwitter;
    if (source.includes('YouTube')) return styles.sourceYouTube;
    return styles.sourceNews;
};

const formatTime = (isoString) => {
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return '刚刚';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
        return date.toLocaleDateString();
    } catch (e) {
        return '';
    }
};

export default function NewsCard({ item }) {
    return (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.card}>
            {item.thumbnail && (
                <div className={styles.thumbnailContainer}>
                    <img src={item.thumbnail} alt={item.titleOriginal} className={styles.thumbnail} loading="lazy" />
                </div>
            )}
            <div className={styles.content}>
                <span className={`${styles.sourceBadge} ${getSourceStyle(item.source)}`}>
                    {item.source}
                </span>
                <h3 className={styles.title}>
                    {item.titleTranslated || item.titleOriginal}
                </h3>
                <div className={styles.meta}>
                    <span>{formatTime(item.timestamp)}</span>
                    {item.views && (
                        <span className={styles.views}>
                            🔥 {item.views}
                        </span>
                    )}
                </div>
            </div>
        </a>
    );
}
