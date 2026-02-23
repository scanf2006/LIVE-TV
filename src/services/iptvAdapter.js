/**
 * 全球 IPTV 适配器 (Pro 版)
 * 负责英、美、加三国精品频道聚合、智能内容归类与多源折叠验证
 */

const M3U_SOURCES = [
    "https://iptv-org.github.io/iptv/countries/uk.m3u",
    "https://iptv-org.github.io/iptv/countries/us.m3u",
    "https://iptv-org.github.io/iptv/countries/ca.m3u",
    "https://iptv-org.github.io/iptv/countries/au.m3u",
    "https://iptv-org.github.io/iptv/countries/nz.m3u",
    "https://iptv-org.github.io/iptv/countries/ie.m3u",
    "https://iptv-org.github.io/iptv/countries/ph.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_firetv.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_klowdtv.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pbs.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_tubi.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_plex.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u",
    "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_samsung.m3u",
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

// 深度语种黑名单：关键字 + TLD 域名 + 元数据后缀
const FOREIGN_KEYWORDS = ['pashto', 'persian', 'iran', 'farsi', 'arabic', 'urdu', 'bengali', 'tamil', 'punjabi', 'turkish', 'hindi', 'afghan', 'espanol', 'spanish', 'norsk', 'polonia'];
const FOREIGN_TLDS = ['.ir', '.pk', '.af', '.tr', '.sa', '.ae', '.eg', '.in', '.ru', '.vn', '.cn', '.pk', '.bd', '.il', '.br', '.it', '.de', '.fr', '.es'];

export const IPTVAdapter = {
    /**
     * 品牌指纹归一化：将地区分台聚合至品牌主线
     */
    normalizeName(rawName) {
        let name = rawName
            .replace(/\(.*\)/g, '')
            .replace(/\[.*\]/g, '')
            .replace(/1080p|720p|fhd|hd|sd/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        const lower = name.toLowerCase();

        // 1. 特殊保护：全国性 24/7 新闻流/重要分号不折叠
        if (lower.includes('news live') || lower.includes('news now') || lower.includes('international') || lower.includes('world')) {
            return name;
        }

        // 2. 核心品牌后缀剥离 (针对 ABC 7, NBC 4, FOX 5 等地区台)
        const brands = ['abc', 'nbc', 'cbs', 'fox', 'pbs', 'bbc', 'cbc', 'itv', 'sky', 'cnn', 'hsn', 'qvc', 'global', 'ctv', 'citynews'];
        for (const b of brands) {
            const brandRegex = new RegExp(`^${b}(\\s+\\d+|\\s+[a-z]+|\\s*-\\s*[a-z]+)`, 'i');
            if (brandRegex.test(name)) {
                if (b === 'bbc') {
                    const bbcSeq = name.match(/^bbc\s+(one|two|three|four|news|hd|alba|parliament)/i);
                    if (bbcSeq) return bbcSeq[0].toUpperCase();
                }
                if (b === 'cbc' && lower.includes('network')) return "CBC News Network";
                return b.toUpperCase();
            }
        }

        return name;
    },

    /**
     * 启发式探测：通过台标、元数据判断语种
     */
    isForeignHeuristic(name, logo, tvgId, originalCategory) {
        const n = (name || "").toLowerCase();
        const l = (logo || "").toLowerCase();
        const t = (tvgId || "").toLowerCase();
        const c = (originalCategory || "").toLowerCase();

        // 1. 关键字穿透 (所有元数据)
        if (FOREIGN_KEYWORDS.some(kw => n.includes(kw) || l.includes(kw) || t.includes(kw) || c.includes(kw))) {
            return true;
        }

        // 2. 通过 Logo 域名后缀判断
        try {
            if (l.startsWith('http')) {
                const url = new URL(l);
                const hostname = url.hostname;
                if (FOREIGN_TLDS.some(tld => hostname.endsWith(tld))) {
                    return true;
                }
            }
        } catch (e) { }

        // 3. 通过 tvg-id 国家后缀判断 (例如 Channel.ar@es)
        // 排除 .uk, .us, .ca, .com, .org 等合法后缀
        const foreignIdRegex = /\.@(?!us|uk|ca|en|com|org|net|edu|int)[a-z]{2,3}$/;
        if (foreignIdRegex.test(t)) return true;

        // 特殊：针对某些特定地区分流
        if (t.includes('.ir@') || t.includes('.pk@') || t.includes('.tr@')) return true;

        return false;
    },

    /**
     * 根据名称识别内容分类
     */
    getCategoryByContent(name, originalCategory, logo, tvgId) {
        const n = (name || "").toLowerCase();
        const oc = (originalCategory || "").toLowerCase();

        // 优先进行语种启发式判定
        if (this.isForeignHeuristic(name, logo, tvgId, originalCategory)) {
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
    isPremiumChannel(name, logo, tvgId) {
        const premiumKeywords = ['cnn', 'bbc', 'hbo', 'discovery', 'history', 'star', 'espn', 'tsn', 'abc', 'nbc', 'cbs', 'fox'];
        const n = (name || "").toLowerCase();

        // 精品频道若被识别为外语则剥夺精品属性
        if (this.isForeignHeuristic(name, logo, tvgId)) return false;

        return premiumKeywords.some(kw => n.includes(kw));
    },

    /**
     * 获取全球聚合频道列表并进行内容精炼与多源折叠
     */
    async fetchCanadaChannels() {
        console.log("[IPTV] Starting deep metadata language detection (UK/US/CA)...");
        const rawChannels = [];

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

        const normalizedMap = new Map();

        for (const ch of rawChannels) {
            const rawName = ch.name || "Unknown";
            const baseName = this.normalizeName(rawName);

            if (!baseName) continue;

            const category = this.getCategoryByContent(baseName, ch.category, ch.logo, ch.tvgId);
            if (category === "Foreign") continue;

            const isPremium = this.isPremiumChannel(baseName, ch.logo, ch.tvgId);

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

            if (!existing.sources.find(s => s.url === ch.url)) {
                existing.sources.push({
                    url: ch.url,
                    label: rawName,
                    qualityScore: ch.qualityScore,
                    tvgId: ch.tvgId
                });
            }
            if (ch.logo && !existing.logo) existing.logo = ch.logo;
        }

        const aggregated = Array.from(normalizedMap.values());
        return aggregated.filter(ch => {
            if (ch.isPremium) return true;
            return ch.sources.length > 0 && ch.category !== "General";
        }).slice(0, 300);
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
        const normalOnes = allChapters.filter(c => !c.isPremium).slice(0, 200); // 探测池扩容
        const pool = [...premiumOnes, ...normalOnes];

        const batchSize = 10;
        for (let i = 0; i < pool.length; i += batchSize) {
            const batch = pool.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(async (group) => {
                const validSources = [];
                for (const src of group.sources.slice(0, 4)) {
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
            if (verifiedGroups.length >= 200) break; // 展示额度扩容
        }

        return verifiedGroups.sort((a, b) => {
            if (a.isPremium !== b.isPremium) return b.isPremium ? -1 : 1;
            return a.category.localeCompare(b.category);
        });
    }
};
