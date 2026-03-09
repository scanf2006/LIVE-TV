'use client';

import React, { useRef, useState } from 'react';
import styles from './IPTV.module.css';

const LONG_PRESS_MS = 750;

const ChannelGrid = ({ channels, onSelect, currentId, favorites = [], onToggleFavorite }) => {
    const pressTimerRef = useRef(null);
    const [isPressing, setIsPressing] = useState(null);

    const handlePressStart = (channel) => {
        setIsPressing(channel.id);
        pressTimerRef.current = setTimeout(() => {
            onToggleFavorite(channel.id);
            setIsPressing(null);
            pressTimerRef.current = 'LONG_PRESSED';
        }, LONG_PRESS_MS);
    };

    const handlePressEnd = (channel) => {
        if (pressTimerRef.current === 'LONG_PRESSED') {
            pressTimerRef.current = null;
            setIsPressing(null);
            return;
        }

        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
        setIsPressing(null);

        onSelect(channel);

        const playerShell = document.querySelector('[data-player-shell="true"]');
        if (playerShell) {
            const reqFS = playerShell.requestFullscreen || playerShell.webkitRequestFullscreen || playerShell.mozRequestFullScreen || playerShell.msRequestFullscreen;
            if (reqFS) reqFS.call(playerShell).catch(() => {});
        }
    };

    const cancelPress = () => {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
        setIsPressing(null);
    };

    return (
        <section className={styles.gridSection}>
            <h2 className={styles.gridTitle}>Live Channels ({channels.length})</h2>
            <div className={styles.grid}>
                {channels.map((channel) => {
                    const isFavorited = favorites.includes(channel.id);
                    const pressing = isPressing === channel.id;

                    return (
                        <button
                            key={channel.id}
                            className={`${styles.card} ${currentId === channel.id ? styles.activeCard : ''} ${pressing ? styles.cardPressing : ''}`}
                            data-focusable="true"
                            type="button"
                            onMouseDown={() => handlePressStart(channel)}
                            onMouseUp={() => handlePressEnd(channel)}
                            onMouseLeave={cancelPress}

                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (!pressTimerRef.current) handlePressStart(channel);
                                }
                            }}
                            onKeyUp={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handlePressEnd(channel);
                                }
                            }}
                            aria-label={`Channel ${channel.name}`}
                        >
                            <div className={styles.cardTopLeft}>
                                <span className={styles.favoriteIcon}>{isFavorited ? '★' : ''}</span>
                            </div>

                            <div className={styles.cardTopRight}>
                                {isFavorited && <span className={styles.favoriteBadge}>FAV</span>}
                                {currentId === channel.id && <span className={styles.activeCardIndicator}></span>}
                            </div>

                            <div className={styles.cardContent}>
                                {channel.logo ? (
                                    <img src={channel.logo} alt="" className={styles.cardLogo} loading="lazy" />
                                ) : (
                                    <div className={styles.cardLogo}>
                                        <span className={styles.logoFallback}>TV</span>
                                    </div>
                                )}
                                <span className={styles.cardName}>{channel.name}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default ChannelGrid;
