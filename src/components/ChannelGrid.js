'use client';

import React from 'react';
import styles from './IPTV.module.css';

const ChannelGrid = ({ channels, onSelect, currentId }) => {
    return (
        <div className={styles.gridSection}>
            <h3 className={styles.gridTitle}>
                <span style={{ color: 'var(--primary)' }}>●</span> 加拿大直播频道 ({channels.length})
            </h3>
            <div className={styles.grid}>
                {channels.map((channel) => (
                    <div
                        key={channel.id}
                        className={`${styles.card} ${currentId === channel.id ? styles.activeCard : ''}`}
                        onClick={() => {
                            onSelect(channel);
                            const video = document.querySelector('video');
                            if (video) {
                                const reqFS = video.requestFullscreen || video.webkitRequestFullscreen || video.mozRequestFullScreen || video.msRequestFullscreen;
                                if (reqFS) reqFS.call(video).catch(err => console.log(err));
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSelect(channel);
                                const video = document.querySelector('video');
                                if (video) {
                                    const reqFS = video.requestFullscreen || video.webkitRequestFullscreen || video.mozRequestFullScreen || video.msRequestFullscreen;
                                    if (reqFS) reqFS.call(video).catch(err => console.log(err));
                                }
                            }
                        }}
                        tabIndex="0"
                        role="button"
                        aria-label={`播放频道: ${channel.name}`}
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
                ))}
            </div>
        </div>
    );
};

export default ChannelGrid;
