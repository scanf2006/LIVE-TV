/**
 * 加拿大 IPTV 适配器
 * 负责获取、解析 IPTV-org 的 M3U 资源，并验证流地址可用性
 */
// import * as Sentry from "@sentry/nextjs";

const M3U_SOURCES = [
    "https://iptv-org.github.io/iptv/countries/ca.m3u",
    "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_canada.m3u8",
    "https://raw.githubusercontent.com/ktpm489/IPTV-2/master/North_America/Canada.m3u8",
    "https://www.apsattv.com/distro.m3u",
    "https://gist.githubusercontent.com/francoisjacques/0ca384a294b9078e58b29c65fda730a9/raw/IPTV%20big%20list.m3u",
    "https://raw.githubusercontent.com/tretv247h/IPTV_List/master/Canada.m3u8.txt",
    "https://iptv-org.github.io/iptv/countries/us.m3u",
    "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_usa.m3u8",
    "https://raw.githubusercontent.com/tretv247h/IPTV_List/master/USA.m3u8.txt"
];

export const IPTVAdapter = {
    /**
     * 获取并从多个源聚合频道，实施深度去重与质量过滤
     */
    async fetchCanadaChannels() {
        console.log("[IPTV] Starting deep optimized aggregation...");
        const allFetchedChannels = [];

        for (const url of M3U_SOURCES) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;

                const m3uText = await response.text();
                const channels = this.parseM3U(m3uText);

                const isUSSource = url.includes('us.m3u') || url.toLowerCase().includes('usa.m3u');
                if (isUSSource) {
                    const premiumUS = channels.filter(c => {
                        const n = (c.name || '').toLowerCase();
                        if (n.includes('cbs news') || n.includes('bloomberg') || n.includes('abc news live') || (n.includes('cnbc') && !n.includes('msnbc'))) return false;
                        return n.includes('cnn') || n.includes('fox') || n.includes('nbc') || n.includes('abc') || n.includes('cbs') || n.includes('espn') || n.includes('usa') || n.includes('hbo') || n.includes('tnt') || n.includes('amc') || n.includes('discovery') || n.includes('history') || n.includes('msnbc');
                    }).slice(0, 45);

                    premiumUS.forEach(c => c.category = "USA Streams");
                    allFetchedChannels.unshift(...premiumUS);
                } else {
                    allFetchedChannels.push(...channels);
                }
            } catch (error) {
                console.error(`[IPTV] Failed to fetch source ${url}:`, error.message);
            }
        }

        // 1. 基础去重 (URL 级别)
        const uniqueByUrl = [];
        const seenUrls = new Set();
        for (const ch of allFetchedChannels) {
            if (ch.url && !seenUrls.has(ch.url)) {
                seenUrls.add(ch.url);
                uniqueByUrl.push(ch);
            }
        }

        // 2. 序列频道精简 (处理如 "News 1, 2, 3, 4" 这种冗余)
        // 算法：提取名称中的基础部分，统计出现次数，同名序列仅保留前 2 个
        const sequenceMap = new Map();
        const simplifiedChannels = [];

        for (const ch of uniqueByUrl) {
            const name = ch.name || "";
            // 正则匹配末尾的数字，如 "CBC 1", "NBC 4" -> 基础名 "CBC", "NBC"
            const baseName = name.replace(/\s+\d+$/g, '').trim().toLowerCase();

            const count = sequenceMap.get(baseName) || 0;
            if (count < 2) { // 每个序列只保留前 2 个变体
                sequenceMap.set(baseName, count + 1);
                simplifiedChannels.push(ch);
            }
        }

        // 3. 最终质量过滤 (加拿大白名单 + 优质美国频道)
        return simplifiedChannels.filter(ch => {
            const name = (ch.name || "").toLowerCase();
            const category = (ch.category || "").toLowerCase();
            if (category.includes('usa streams')) return true;
            return name.includes('cbc toronto') || name.includes('citynews toronto');
        });
    },

    /**
     * 解析 M3U 格式文本，并注入码率分数
     */
    parseM3U(text) {
        const lines = text.split("\n");
        const channels = [];
        let currentChannel = null;

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF:")) {
                currentChannel = { qualityScore: 0 };
                const commaIndex = line.lastIndexOf(",");
                if (commaIndex !== -1) {
                    currentChannel.name = line.substring(commaIndex + 1).trim();
                    // 识别码率关键字并打分
                    const n = currentChannel.name.toLowerCase();
                    if (n.includes('1080p') || n.includes('fhd')) currentChannel.qualityScore = 100;
                    else if (n.includes('720p') || n.includes('hd')) currentChannel.qualityScore = 80;
                    else if (n.includes('480p') || n.includes('sd')) currentChannel.qualityScore = 50;
                }
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) currentChannel.logo = logoMatch[1];
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) currentChannel.category = groupMatch[1];
                const idMatch = line.match(/tvg-id="([^"]+)"/);
                if (idMatch) currentChannel.tvgId = idMatch[1];
            } else if (line.startsWith("http") && currentChannel) {
                currentChannel.url = line;
                currentChannel.id = `iptv-${currentChannel.tvgId || Math.random().toString(36).substr(2, 9)}`;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
        return channels;
    },

    /**
     * 验证单个流地址是否可用，并返回延迟 (ms)
     * @param {string} url 
     */
    async validateStream(url) {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            clearTimeout(timeoutId);
            const latency = Date.now() - start;
            if (response.ok || response.status === 206) return { isValid: true, latency };

            // 备选方案：尝试 Range 请求
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 3500);
            const res2 = await fetch(url, { signal: controller2.signal, headers: { 'Range': 'bytes=0-0' } });
            clearTimeout(timeoutId2);
            return { isValid: res2.ok, latency: Date.now() - start };
        } catch (e) {
            return { isValid: false, latency: 9999 };
        }
    },

    /**
     * 批量验证频道并根据 质量+延迟 进行最终金牌筛选
     */
    async getVerifiedChannels() {
        const allChannels = await this.fetchCanadaChannels();
        const verified = [];
        const batchSize = 30;

        for (let i = 0; i < allChannels.length; i += batchSize) {
            const batch = allChannels.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (ch) => {
                    const check = await this.validateStream(ch.url);
                    if (check.isValid) {
                        return { ...ch, latency: check.latency };
                    }
                    return null;
                })
            );
            verified.push(...results.filter(Boolean));
            if (verified.length >= 80) break; // 扩大上限以供排序后挑选
        }

        // 金牌排序算法：质量分优先，同质量下延迟低者胜出
        verified.sort((a, b) => {
            if (b.qualityScore !== a.qualityScore) {
                return b.qualityScore - a.qualityScore;
            }
            return a.latency - b.latency;
        });

        // 最终只输出前 60 个最优源
        return verified.slice(0, 60);
    }
};
