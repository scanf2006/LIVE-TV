'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './IPTV.module.css';

const IPTVPlayer = ({ channel, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!channel || !channel.url) return;

        const initPlayer = async () => {
            setLoading(true);
            setError(null);

            const video = videoRef.current;
            if (!video) return;

            // 动态导入 hls.js 以避免在 SSR 或非浏览器环境报错
            try {
                const Hls = (await import('hls.js')).default;

                if (Hls.isSupported()) {
                    if (hlsRef.current) {
                        hlsRef.current.destroy();
                    }

                    const hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 60
                    });

                    hls.loadSource(channel.url);
                    hls.attachMedia(video);
                    hlsRef.current = hls;

                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        setLoading(false);
                        if (autoPlay) video.play().catch(e => console.log("Autoplay blocked", e));
                    });

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    setError("播放失败，请尝试其他频道");
                                    hls.destroy();
                                    break;
                            }
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // 原生支持 (如 Safari, iOS)
                    video.src = channel.url;
                    video.addEventListener('loadedmetadata', () => {
                        setLoading(false);
                        if (autoPlay) video.play();
                    });
                    video.addEventListener('error', () => setError("当前设备不支持该流格式"));
                } else {
                    setError("您的浏览器不支持 HLS 直播播放");
                }
            } catch (err) {
                console.error("Hls.js 加载失败", err);
                setError("播放驱动加载失败，请刷新页面");
            }
        };

        initPlayer();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [channel, autoPlay]);

    if (!channel) return null;

    return (
        <div className={`${styles.playerSection} ${loading || error ? '' : styles.overlayActive}`} tabIndex="0">
            {/* 动态背景光效 */}
            {!error && !loading && <div className={styles.ambientLight} />}

            <video
                ref={videoRef}
                className={styles.videoPlayer}
                controls={false} // 使用自定义控制界面
                playsInline
                poster={channel.logo}
            />

            {loading && (
                <div className={styles.playerOverlay} style={{ opacity: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <div className={styles.spinner}></div>
                </div>
            )}

            {error && (
                <div className={styles.playerOverlay} style={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📡</span>
                        <p style={{ color: '#ff4d4d', fontWeight: 'bold', fontSize: '1.2rem' }}>{error}</p>
                        <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>请尝试切换其他频道</p>
                    </div>
                </div>
            )}

            <div className={styles.playerOverlay}>
                <div className={styles.channelInfo}>
                    {channel.logo && <img src={channel.logo} alt="" className={styles.channelLogo} />}
                    <div>
                        <span className={styles.channelName}>{channel.name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <div className={styles.categoryBadge}>Live</div>
                            {channel.category && <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>• {channel.category}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IPTVPlayer;
