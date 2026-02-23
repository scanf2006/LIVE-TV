'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './IPTV.module.css';

const IPTVPlayer = ({ channel, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [activeSourceIndex, setActiveSourceIndex] = useState(0);

    // 当切换频道时，重置线路索引
    useEffect(() => {
        setActiveSourceIndex(0);
    }, [channel?.id]);

    useEffect(() => {
        if (!channel || (!channel.url && (!channel.sources || channel.sources.length === 0))) return;

        const currentUrl = channel.sources ? channel.sources[activeSourceIndex]?.url : channel.url;
        if (!currentUrl) return;

        const initPlayer = async () => {
            setLoading(true);
            setError(null);

            const video = videoRef.current;
            if (!video) return;

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

                    hls.loadSource(currentUrl);
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
                                    setError("播放失败，请尝试切换线路或频道");
                                    hls.destroy();
                                    break;
                            }
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = currentUrl;
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
    }, [channel, activeSourceIndex, autoPlay]);

    // 监听键盘左右键切换线路
    useEffect(() => {
        const handleSourceKey = (e) => {
            if (!channel?.sources || channel.sources.length <= 1) return;

            if (e.key === 'ArrowLeft') {
                setActiveSourceIndex(prev => (prev - 1 + channel.sources.length) % channel.sources.length);
            } else if (e.key === 'ArrowRight') {
                setActiveSourceIndex(prev => (prev + 1) % channel.sources.length);
            }
        };
        window.addEventListener('keydown', handleSourceKey);
        return () => window.removeEventListener('keydown', handleSourceKey);
    }, [channel]);

    if (!channel) return null;

    return (
        <div className={`${styles.playerSection} ${loading || error ? '' : styles.overlayActive}`} tabIndex="0">
            {/* 动态背景光效 */}
            {!error && !loading && <div className={styles.ambientLight} />}

            <video
                ref={videoRef}
                className={styles.videoPlayer}
                controls={false}
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
                        <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>请尝试按 [方向键] 切换备选线路</p>
                    </div>
                </div>
            )}

            <div className={styles.playerOverlay}>
                <div className={styles.channelInfo}>
                    {channel.logo && <img src={channel.logo} alt="" className={styles.channelLogo} />}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className={styles.channelName}>{channel.name}</span>
                            {channel.sources && channel.sources.length > 1 && (
                                <div className={styles.sourceSelector}>
                                    线路 {activeSourceIndex + 1} / {channel.sources.length}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                            <div className={styles.categoryBadge}>{channel.isPremium ? 'PRO 精选' : 'Live'}</div>
                            {channel.category && <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>• {channel.category}</span>}
                            <div className={styles.tvHint}>
                                {channel.sources && channel.sources.length > 1 && (
                                    <span style={{ color: 'var(--tv-primary)', fontWeight: 'bold' }}>按 [左右键] 切换线路</span>
                                )}
                                <span>按 [上下键] 切台</span>
                                <span>按 [确认键] 全屏</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IPTVPlayer;
