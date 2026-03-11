'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './IPTV.module.css';

const IPTVPlayer = ({ channel, autoPlay = true }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeSourceIndex, setActiveSourceIndex] = useState(0);

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
                        if (autoPlay) video.play().catch(() => { });
                    });

                    hls.on(Hls.Events.ERROR, (_event, data) => {
                        if (!data.fatal) return;

                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                setError('Playback failed. Try another source or channel.');
                                hls.destroy();
                                break;
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = currentUrl;
                    video.addEventListener('loadedmetadata', () => {
                        setLoading(false);
                        if (autoPlay) video.play().catch(() => { });
                    });
                    video.addEventListener('error', () => setError('This stream format is not supported on your device.'));
                } else {
                    setError('Your browser does not support HLS playback.');
                }
            } catch (err) {
                console.error('Hls.js load error', err);
                setError('Player failed to initialize. Please refresh.');
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

    useEffect(() => {
        const handleSourceKey = (e) => {
            if (!channel?.sources || channel.sources.length <= 1) return;

            if (e.key === 'ArrowLeft') {
                setActiveSourceIndex((prev) => (prev - 1 + channel.sources.length) % channel.sources.length);
            } else if (e.key === 'ArrowRight') {
                setActiveSourceIndex((prev) => (prev + 1) % channel.sources.length);
            }
        };

        window.addEventListener('keydown', handleSourceKey);
        return () => window.removeEventListener('keydown', handleSourceKey);
    }, [channel]);

    if (!channel) return null;

    return (
        <section className={`${styles.playerSection} ${loading || error ? '' : styles.overlayActive}`} data-player-shell="true">
            <video
                ref={videoRef}
                className={styles.videoPlayer}
                style={{ position: 'relative', zIndex: 1 }}
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
                <div className={styles.playerOverlay} style={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#ffd4d4', fontWeight: 700, fontSize: '1.15rem' }}>{error}</p>
                        <p style={{ opacity: 0.75, marginTop: '0.45rem' }}>Use left/right to switch source.</p>
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
                                    Source {activeSourceIndex + 1} / {channel.sources.length}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <div className={styles.categoryBadge}>{channel.isPremium ? 'Premium' : 'Live'}</div>
                            {channel.category && <span style={{ opacity: 0.75, fontSize: '0.95rem' }}>{channel.category}</span>}
                            <div className={styles.tvHint}>
                                {channel.sources && channel.sources.length > 1 && <span>Left/Right: source</span>}
                                <span>Up/Down: channel</span>
                                <span>OK: fullscreen</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IPTVPlayer;
