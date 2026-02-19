'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import styles from './NewsCard.module.css';

export default function NewsCard({ item, onDelete }) {
    const [translateX, setTranslateX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isDragging = useRef(false);

    const DELETE_THRESHOLD = -100; // 向左滑动100px触发删除

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;

        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;

        // 只允许向左滑动
        if (diff < 0) {
            setTranslateX(diff);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        // 判断是否触发删除
        if (translateX < DELETE_THRESHOLD) {
            // 触发删除
            setIsDeleting(true);
            setTranslateX(-500); // 滑出屏幕

            // 300ms后调用删除回调
            setTimeout(() => {
                onDelete(item.id);
            }, 300);
        } else {
            // 回弹
            setTranslateX(0);
        }
    };

    const cardStyle = {
        transform: `translateX(${translateX}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
        opacity: isDeleting ? 0 : 1
    };

    const deleteIndicatorStyle = {
        opacity: translateX < DELETE_THRESHOLD / 2 ? 1 : 0,
        transition: 'opacity 0.2s'
    };

    return (
        <div className={styles.cardWrapper}>
            {/* 删除指示器背景 */}
            <div className={styles.deleteIndicator} style={deleteIndicatorStyle}>
                <span>🗑️ 删除</span>
            </div>

            {/* 卡片 */}
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
                    {/* 标题 */}
                    <h3 className={styles.title}>
                        {item?.titleTranslated || item?.titleOriginal || '无标题'}
                    </h3>

                    {/* 元信息 */}
                    <div className={styles.meta}>
                        <span className={`
                            ${styles.sourceTag} 
                            ${item?.source?.includes('微博') ? styles.source_weibo :
                                item?.source?.includes('Twitter') || item?.source?.includes('X') ? styles.source_twitter :
                                    item?.source?.toLowerCase().includes('reddit') ? styles.source_reddit :
                                        item?.source?.toLowerCase().includes('youtube') ? styles.source_youtube :
                                            styles.source_rss}
                        `}>
                            {item?.source || '未知来源'}
                        </span>
                        {item?.views && (
                            <span className={styles.views}>
                                <span>👁</span> {item.views}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}
