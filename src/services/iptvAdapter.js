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
    "https://raw.githubusercontent.com/tretv247h/IPTV_List/master/Canada.m3u8.txt"
];

export const IPTVAdapter = {
    /**
     * 获取并从多个源聚合加拿大频道
     */
    async fetchCanadaChannels() {
        console.log("[IPTV] Starting multi-source aggregation...");
        const allFetchedChannels = [];

        for (const url of M3U_SOURCES) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;

                const m3uText = await response.text();
                const channels = this.parseM3U(m3uText);
                allFetchedChannels.push(...channels);
                console.log(`[IPTV] Fetched ${channels.length} channels from: ${url}`);
            } catch (error) {
                console.error(`[IPTV] Failed to fetch source ${url}:`, error.message);
            }
        }

        // 去重逻辑：基于 URL 或名称
        const uniqueChannels = [];
        const seenUrls = new Set();

        for (const ch of allFetchedChannels) {
            if (ch.url && !seenUrls.has(ch.url)) {
                seenUrls.add(ch.url);
                uniqueChannels.push(ch);
            }
        }

        console.log(`[IPTV] Aggregation complete. Total unique channels before filtering: ${uniqueChannels.length}`);

        // 黑名单，拦截用户不要的频道
        const blacklist = [
            "3ABN Canada",
            "5AAB TV",
            "A&E East",
            "Amazing Discoveries TV",
            "Az Star TV"
        ].map(n => n.toLowerCase());

        // 深度过滤：排除法语频道 + 排除 720p 以下 (通过名称或标签判断)
        const highQualityEnglishChannels = uniqueChannels.filter(ch => {
            const name = (ch.name || "").toLowerCase();
            const lang = (ch.language || "").toLowerCase();
            const category = (ch.category || "").toLowerCase();

            // 0. 特别指定的黑名单过滤
            if (blacklist.some(b => name.includes(b))) {
                return false;
            }

            // 1. 语言过滤 (排除法语相关)
            const isFrench = lang.includes("french") || lang.includes("fra") ||
                category.includes("french") || category.includes("français") ||
                name.includes("(fr)") || name.includes(" français");
            if (isFrench) return false;

            // 2. 分辨率过滤 (彻底屏蔽明确标注为低画质的频道)
            const lowResKeywords = ["360p", "480p", "240p", " sd", "(sd)", "low quality", "lq"];
            if (lowResKeywords.some(kw => name.includes(kw) || category.includes(kw))) {
                return false;
            }

            // 策略：如果名称中明确标注了 HD/1080/720/FHD/4K，即使没有排除项也优先保留
            return true;
        });

        console.log(`[IPTV] Final filtered channels: ${highQualityEnglishChannels.length}`);
        return highQualityEnglishChannels;
    },

    /**
     * 解析 M3U 格式文本
     */
    parseM3U(text) {
        const lines = text.split("\n");
        const channels = [];
        let currentChannel = null;

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith("#EXTINF:")) {
                // 解析信息行: #EXTINF:-1 tvg-id="..." tvg-logo="..." group-title="...",Channel Name
                currentChannel = {};

                // 提取名称 (逗号后的内容)
                const commaIndex = line.lastIndexOf(",");
                if (commaIndex !== -1) {
                    currentChannel.name = line.substring(commaIndex + 1).trim();
                }

                // 提取 Logo
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) currentChannel.logo = logoMatch[1];

                // 提取 分组
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) currentChannel.category = groupMatch[1];

                // 提取 语言
                const langMatch = line.match(/tvg-language="([^"]+)"/);
                if (langMatch) currentChannel.language = langMatch[1];

                // 提取 ID
                const idMatch = line.match(/tvg-id="([^"]+)"/);
                if (idMatch) currentChannel.tvgId = idMatch[1];

            } else if (line.startsWith("http") && currentChannel) {
                // 流地址行
                currentChannel.url = line;
                // 生成唯一标识
                currentChannel.id = `iptv-${currentChannel.tvgId || Math.random().toString(36).substr(2, 9)}`;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }

        return channels;
    },

    /**
     * 验证单个流地址是否可用
     * @param {string} url 
     */
    async validateStream(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            clearTimeout(timeoutId);
            return response.ok || response.status === 206; // 206 Partial Content 也算成功
        } catch (e) {
            // 某些服务器可能不支持 HEAD 请求，尝试简单的 GET 并立即断开
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Range': 'bytes=0-0' } // 只请求 1 字节
                });
                clearTimeout(timeoutId);
                return response.ok;
            } catch (innerErr) {
                return false;
            }
        }
    },

    /**
     * 批量验证频道并过滤可用源
     */
    async getVerifiedChannels() {
        const allChannels = await this.fetchCanadaChannels();

        // 为了性能，我们并行验证，但限制并发数防止带宽和性能瓶颈
        const verified = [];
        const batchSize = 40; // 高并发验证

        for (let i = 0; i < allChannels.length; i += batchSize) {
            const batch = allChannels.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (ch) => {
                    const isValid = await this.validateStream(ch.url);
                    return isValid ? ch : null;
                })
            );
            verified.push(...results.filter(Boolean));

            // 将上限降低到 60 个。这对于 TV 首屏来说已经足够多，且能极大缩短首次加载时间。
            if (verified.length >= 60) break;
        }

        // 如果没有可用频道，至少返回前几个原始频道
        return verified.length > 0 ? verified : allChannels.slice(0, 40);
    }
};
