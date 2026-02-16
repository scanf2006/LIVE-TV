import Link from 'next/link';
import styles from './NewsCard.module.css';

export default function NewsCard({ item }) {
    const hasThumbnail = item?.thumbnail;

    return (
        <Link
            href={item?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
        >
            <div className={styles.content}>
                {/* 缩略图 */}
                {hasThumbnail ? (
                    <img
                        src={item.thumbnail}
                        alt={item.titleTranslated || item.titleOriginal}
                        className={styles.thumbnail}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.placeholder}>
                        📰
                    </div>
                )}

                {/* 标题 */}
                <h3 className={styles.title}>
                    {item?.titleTranslated || item?.titleOriginal || '无标题'}
                </h3>

                {/* 元信息 */}
                <div className={styles.meta}>
                    <span className={styles.source}>{item?.source || '未知来源'}</span>
                    {item?.views && (
                        <span className={styles.views}>👁 {item.views}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
