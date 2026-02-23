'use client';

import React, { useRef, useState } from 'react';
import styles from './IPTV.module.css';

const ChannelGrid = ({ channels, onSelect, currentId, favorites = [], onToggleFavorite }) => {
    const pressTimerRef = useRef(null);
    const [isPressing, setIsPressing] = useState(null); // 存储当前正在长按的频道ID

    const handlePressStart = (channel) => {
        setIsPressing(channel.id);
        pressTimerRef.current = setTimeout(() => {
            onToggleFavorite(channel.id);
            // 长按成功后给一个简单的触感反馈（如果支持）或视觉闪烁
            setIsPressing(null);
            pressTimerRef.current = 'LONG_PRESSED';
        }, 800);
    };

    const handlePressEnd = (channel) => {
        if (pressTimerRef.current === 'LONG_PRESSED') {
            // 如果已经是长按触发了，则不做播放动作
            pressTimerRef.current = null;
            setIsPressing(null);
            return;
        }

        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
        setIsPressing(null);

        // 短按逻辑：执行播放
        onSelect(channel);
        const video = document.querySelector('video');
        if (video) {
            const reqFS = video.requestFullscreen || video.webkitRequestFullscreen || video.mozRequestFullScreen || video.msRequestFullscreen;
            if (reqFS) reqFS.call(video).catch(err => console.log(err));
        }
    };

    return (
        <div className={styles.gridSection}>
            <h3 className={styles.gridTitle}>
                <span style={{ color: 'var(--primary)' }}>●</span> 全球精品频道 ({channels.length})
                <span style={{ fontSize: '0.8rem', marginLeft: '1rem', opacity: 0.5 }}>提示：长按确定键收藏 / 短按播放</span>
            </h3>
            <div className={styles.grid}>
                {channels.map((channel) => {
                    const isFavorited = favorites.includes(channel.id);
                    const pressing = isPressing === channel.id;

                    return (
                        <div
                            key={channel.id}
                            className={`${styles.card} ${currentId === channel.id ? styles.activeCard : ''} ${pressing ? styles.cardPressing : ''}`}
                            tabIndex="0"
                            role="button"
                            aria-label={`频道: ${channel.name}，长按收藏`}
                            onMouseDown={() => handlePressStart(channel)}
                            onMouseUp={() => handlePressEnd(channel)}
                            onMouseLeave={() => {
                                clearTimeout(pressTimerRef.current);
                                pressTimerRef.current = null;
                                setIsPressing(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'OK') {
                                    if (!pressTimerRef.current) handlePressStart(channel);
                                }
                            }}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter' || e.key === 'OK') {
                                    handlePressEnd(channel);
                                }
                            }}
                        >
                            {/* 状态指示区 */}
                            <div className={styles.cardTopLeft}>
                                <span className={styles.favoriteIcon} style={{ fontSize: '1.2rem' }}>
                                    {isFavorited ? '❤️' : ''}
                                </span>
                            </div>

                            <div className={styles.cardTopRight}>
                                {isFavorited && <span className={styles.favoriteBadge}>SAVED</span>}
                                {currentId === channel.id && <span className={styles.activeCardIndicator}></span>}
                            </div>

                            <div className={styles.cardContent}>
                                {channel.logo ? (
                                    <img src={channel.logo} alt="" className={styles.cardLogo} loading="lazy" />
                                ) : (
                                    <div className={styles.cardLogo} style={{ backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '2rem' }}>📺</span>
                                    </div>
                                )}
                                <span className={styles.cardName}>{channel.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChannelGrid;
