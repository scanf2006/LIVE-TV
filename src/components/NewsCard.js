'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './NewsCard.module.css';

export default function NewsCard({ item, onDelete }) {
    const [translateX, setTranslateX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);

    const DELETE_THRESHOLD = -100;

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;

        if (diff < 0) {
            setTranslateX(diff);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (translateX < DELETE_THRESHOLD) {
            setIsDeleting(true);
            setTranslateX(-500);

            setTimeout(() => {
                onDelete(item.id);
            }, 300);
        } else {
            setTranslateX(0);
        }
    };

    const cardStyle = {
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        opacity: isDeleting ? 0 : 1
    };

    const deleteIndicatorStyle = {
        opacity: translateX < DELETE_THRESHOLD / 2 ? 1 : 0,
        transition: 'opacity 0.2s'
    };

    return (
        <div className={styles.cardWrapper}>
            <div className={styles.deleteIndicator} style={deleteIndicatorStyle}>
                <span>Delete</span>
            </div>

            <Link
                href={item?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
                style={cardStyle}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={styles.content}>
                    <h3 className={styles.title}>
                        {item?.titleTranslated || item?.titleOriginal || 'Untitled'}
                    </h3>

                    <div className={styles.meta}>
                        <span className={`
                            ${styles.sourceTag}
                            ${item?.source?.includes('微博') ? styles.source_weibo :
                                item?.source?.includes('Twitter') || item?.source?.includes('X') ? styles.source_twitter :
                                    item?.source?.toLowerCase().includes('reddit') ? styles.source_reddit :
                                        item?.source?.toLowerCase().includes('youtube') ? styles.source_youtube :
                                            styles.source_rss}
                        `}>
                            {item?.source || 'Unknown Source'}
                        </span>
                        {item?.views && (
                            <span className={styles.views}>
                                <span>Views</span> {item.views}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
