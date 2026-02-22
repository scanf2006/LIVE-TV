'use client';

import React, { useState, useEffect } from 'react';
import IPTVPlayer from '@/components/IPTVPlayer';
import ChannelGrid from '@/components/ChannelGrid';
import Header from '@/components/Header';
import styles from '@/components/IPTV.module.css';

export default function IPTVPage() {
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadChannels = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/iptv');
                const data = await response.json();

                if (data.success) {
                    setChannels(data.data);
                    if (data.data.length > 0) {
                        setCurrentChannel(data.data[0]);
                    }
                } else {
                    setError(`加载结果异常: ${data.message || '未知错误'}`);
                }
            } catch (err) {
                console.error('Fetch error details:', err);
                setError(`无法连接到服务器 (${err.message})。请确保您已在终端启动了项目服务。`);
            } finally {
                setLoading(false);
            }
        };

        loadChannels();
    }, []);

    // 遥控器基本焦点支持 (D-pad)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 捕获常见的 TV 键码
            const key = e.key;
            const activeElement = document.activeElement;

            // 如果当前没有焦点，默认聚焦到第一个可用卡片
            if (!activeElement || activeElement === document.body) {
                const firstCard = document.querySelector(`.${styles.card}`);
                if (firstCard) firstCard.focus();
                return;
            }

            // 额外的全屏切换支持 (通常是遥控器的蓝键或菜单预览)
            if (key === 'f' || key === 'F' || key === 'MediaPlayPause') {
                const video = document.querySelector('video');
                if (video) {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        video.requestFullscreen().catch(e => console.error(e));
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [channels]);

    return (
        <main className={`${styles.container} ${styles.fadeIn}`}>
            {/* 全局背景氛围 */}
            <div className={styles.ambientLight} />

            <div className={styles.content}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: 900 }}>
                        Live Canada
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
                        Premium Live Streams • Optimized for Fire TV
                    </p>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>正在拉取并验证加拿大直播源...</p>
                    </div>
                ) : error ? (
                    <div className={styles.loading} style={{ color: '#ff4d4d' }}>
                        <span style={{ fontSize: '3rem' }}>⚠️</span>
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ padding: '0.8rem 2rem', background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer' }}
                        >
                            重新重试
                        </button>
                    </div>
                ) : (
                    <>
                        <IPTVPlayer channel={currentChannel} />
                        <ChannelGrid
                            channels={channels}
                            onSelect={setCurrentChannel}
                            currentId={currentChannel?.id}
                        />
                    </>
                )}
            </div>

            <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                <p>© 2026 Global News PWA - Canada IPTV Edition</p>
                <p>资源来源于开源社区，仅供学习交流</p>
            </footer>
        </main>
    );
}
