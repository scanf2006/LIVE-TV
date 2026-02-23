'use client';

import React from 'react';
import styles from './IPTV.module.css';

const ChannelGrid = ({ channels, onSelect, currentId, favorites = [], onToggleFavorite }) => {
    return (
        <div className={styles.gridSection}>
            <h3 className={styles.gridTitle}>
                <span style={{ color: 'var(--primary)' }}>●</span> 全球精品频道 ({channels.length})
            </h3>
            <div className={styles.grid}>
                {channels.map((channel) => {
                    const isFavorited = favorites.includes(channel.id);

                    return (
                        <div
                            key={channel.id}
                            className={`${styles.card} ${currentId === channel.id ? styles.activeCard : ''}`}
                            tabIndex="0"
                            role="button"
                            aria-label={`播放频道: ${channel.name}`}
                        >
                            {/* 收藏按钮 - 独立可点击 */}
                            <button
                                className={`${styles.favoriteBtn} ${isFavorited ? styles.favoriteBtnActive : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(channel.id);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.stopPropagation();
                                        onToggleFavorite(channel.id);
                                    }
                                }}
                                tabIndex="0"
                                title={isFavorited ? "取消收藏" : "加入收藏"}
                            >
                                <span className={styles.favoriteIcon}>{isFavorited ? '❤️' : '🤍'}</span>
                            </button>

                            <div className={styles.cardTopRight}>
                                {isFavorited && <span className={styles.favoriteBadge}>SAVED</span>}
                                {currentId === channel.id && <span className={styles.activeCardIndicator}></span>}
                            </div>

                            <div
                                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
                                onClick={() => {
                                    onSelect(channel);
                                    const video = document.querySelector('video');
                                    if (video) {
                                        const reqFS = video.requestFullscreen || video.webkitRequestFullscreen || video.mozRequestFullScreen || video.msRequestFullscreen;
                                        if (reqFS) reqFS.call(video).catch(err => console.log(err));
                                    }
                                }}
                            >
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
