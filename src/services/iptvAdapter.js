/**
 * 全球 IPTV 适配器 (Pro 版)
 * 负责英、美、加三国精品频道聚合、智能内容归类与多源折叠验证
 */

const M3U_SOURCES = [
    "https://iptv-org.github.io/iptv/countries/uk.m3u",
    "https://iptv-org.github.io/iptv/countries/us.m3u",
    "https://iptv-org.github.io/iptv/countries/ca.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_firetv.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_klowdtv.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pbs.m3u",
    "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_canada.m3u8",
    "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_usa.m3u8"
];

// 内容分类映射矩阵
const CONTENT_MAPPING = {
    'News': ['news', 'bbc news', 'cnn', 'msnbc', 'reuters', 'bloomberg', 'cnbc', 'al jazeera', 'sky news', 'citynews', 'cbc news'],
    'Sports': ['sports', 'espn', 'tsn', 'stadium', 'fifa', 'f1', 'golf', 'football', 'nba', 'ufc', 'fight'],
    'Movies': ['movie', 'hbo', 'amc', 'cinema', 'film', 'star movies', 'paramount'],
    'Documentary': ['discovery', 'history', 'nasa', 'national geographic', 'nat geo', 'animal planet', 'science', 'nature', 'curiosity'],
    'Entertainment': ['entertainment', 'comedy', 'mtv', 'tnt', 'tbs', 'abc', 'cbs', 'nbc', 'fox', 'bbc', 'itv', 'channel 4', 'channel 5', 'hgtv', 'food'],
    'Kids': ['kids', 'nick', 'disney', 'cartoon', 'cbeebies', 'pop', 'boing', 'baby'],
    'Music': ['music', 'mtv', 'v2beat', 'stingray', 'concert']
};

const FOREIGN_KEYWORDS = ['pashto', 'persian', 'iran', 'farsi', 'arabic', 'urdu', 'bengali', 'tamil', 'punjabi', 'turkish', 'hindi', 'afghan'];

export const IPTVAdapter = {
    /**
     * 根据名称识别内容分类
     */
    getCategoryByContent(name, originalCategory) {
        const n = (name || "").toLowerCase();
        const oc = (originalCategory || "").toLowerCase();

        // 优先过滤外语
        if (FOREIGN_KEYWORDS.some(kw => n.includes(kw) || oc.includes(kw))) {
            return "Foreign";
        }

        for (const [cat, keywords] of Object.entries(CONTENT_MAPPING)) {
            if (keywords.some(kw => n.includes(kw) || oc.includes(kw))) {
                return cat;
            }
        }
        return "General";
    },

    /**
     * 判断是否为顶级精品频道 (且非外语)
     */
    isPremiumChannel(name) {
        const premiumKeywords = ['cnn', 'bbc', 'hbo', 'discovery', 'history', 'star', 'espn', 'tsn', 'abc', 'nbc', 'cbs', 'fox'];
        const n = (name || "").toLowerCase();

        // 如果包含外语关键字，哪怕包含 premium 词根也不算精品 (例如 BBC Persian)
        if (FOREIGN_KEYWORDS.some(kw => n.includes(kw))) return false;

        return premiumKeywords.some(kw => n.includes(kw));
    },

    /**
     * 获取全球聚合频道列表并进行内容精炼与多源折叠
     */
    async fetchCanadaChannels() {
        console.log("[IPTV] Starting global premium aggregation (UK/US/CA) with deep filtering...");
        const rawChannels = [];

        // 并发获取所有源
        await Promise.all(M3U_SOURCES.map(async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) return;
                const m3uText = await response.text();
                const parsed = this.parseM3U(m3uText);
                rawChannels.push(...parsed);
            } catch (e) {
                console.error(`[IPTV] Source error: ${url}`, e.message);
            }
        }));

        // 1. 进行“标准化名称”识别，用于多源折叠
        const normalizedMap = new Map();

        for (const ch of rawChannels) {
            const rawName = ch.name || "Unknown";

            // 深度去噪：去除括号、分辨率、地区标识以及末尾数字
            const baseName = rawName
                .replace(/\(.*\)/g, '')
                .replace(/\[.*\]/g, '')
                .replace(/1080p|720p|fhd|hd|sd/gi, '')
                .replace(/\s+\d+$/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (!baseName) continue;

            const category = this.getCategoryByContent(baseName, ch.category);

            // 过滤掉确定为外语的分类
            if (category === "Foreign") continue;

            const isPremium = this.isPremiumChannel(baseName);

            if (!normalizedMap.has(baseName)) {
                normalizedMap.set(baseName, {
                    id: `ch-${baseName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: baseName,
                    category,
                    isPremium,
                    logo: ch.logo,
                    sources: []
                });
            }

            const existing = normalizedMap.get(baseName);
            existing.sources.push({
                url: ch.url,
                label: rawName,
                qualityScore: ch.qualityScore,
                tvgId: ch.tvgId
            });
            if (ch.logo && !existing.logo) existing.logo = ch.logo;
        }

        const aggregated = Array.from(normalizedMap.values());
        return aggregated.filter(ch => {
            if (ch.isPremium) return true;
            return ch.sources.length > 0 && ch.category !== "General";
        }).slice(0, 100);
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
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
        return channels;
    },

    /**
     * 验证单个流地址是否可用，并返回延迟 (ms)
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
            return { isValid: false, latency: 9999 };
        } catch (e) {
            return { isValid: false, latency: 9999 };
        }
    },

    /**
     * 批量验证频道金牌筛选
     */
    async getVerifiedChannels() {
        const allChapters = await this.fetchCanadaChannels();
        const verifiedGroups = [];

        const premiumOnes = allChapters.filter(c => c.isPremium);
        const normalOnes = allChapters.filter(c => !c.isPremium).slice(0, 50);
        const pool = [...premiumOnes, ...normalOnes];

        const batchSize = 10;
        for (let i = 0; i < pool.length; i += batchSize) {
            const batch = pool.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(async (group) => {
                const validSources = [];
                for (const src of group.sources.slice(0, 3)) {
                    const check = await this.validateStream(src.url);
                    if (check.isValid) {
                        validSources.push({ ...src, latency: check.latency });
                    }
                }
                if (validSources.length > 0) {
                    validSources.sort((a, b) => (b.qualityScore - a.qualityScore) || (a.latency - b.latency));
                    return { ...group, sources: validSources, url: validSources[0].url };
                }
                return null;
            }));
            verifiedGroups.push(...results.filter(Boolean));
            if (verifiedGroups.length >= 80) break;
        }

        return verifiedGroups.sort((a, b) => {
            if (a.isPremium !== b.isPremium) return b.isPremium ? -1 : 1;
            return a.category.localeCompare(b.category);
        });
    }
};
