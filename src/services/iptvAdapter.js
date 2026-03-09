/**
 * North America IPTV adapter (US/CA only, English-first).
 */

const M3U_SOURCES = [
    // Core country playlists
    'https://iptv-org.github.io/iptv/countries/us.m3u',
    'https://iptv-org.github.io/iptv/countries/ca.m3u',

    // High quality US ecosystem playlists
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_firetv.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pbs.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_plex.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_tubi.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_samsung.m3u'
];

const CONTENT_MAPPING = {
    News: ['news', 'cnn', 'msnbc', 'cnbc', 'bbc news', 'bloomberg', 'reuters', 'al jazeera english', 'sky news', 'cbc news', 'cp24', 'citynews', 'global news'],
    Sports: ['sports', 'espn', 'tsn', 'sportsnet', 'nba', 'nfl', 'nhl', 'mlb', 'fifa', 'golf', 'ufc'],
    Movies: ['movie', 'cinema', 'film', 'hbo', 'amc', 'paramount', 'showtime'],
    Documentary: ['discovery', 'history', 'national geographic', 'nat geo', 'science', 'nature', 'nasa', 'smithsonian'],
    Entertainment: ['abc', 'cbs', 'nbc', 'fox', 'ctv', 'global', 'citytv', 'entertainment', 'comedy', 'food', 'hgtv'],
    Kids: ['kids', 'nick', 'disney', 'cartoon', 'family'],
    Music: ['music', 'mtv', 'stingray', 'vevo', 'concert']
};

const FEATURED_ENGLISH_KEYWORDS = [
    'abc news live', 'cbs news', 'nbc news now', 'fox weather', 'weather nation',
    'cnn', 'msnbc', 'cnbc', 'bloomberg', 'bbc news', 'reuters', 'al jazeera english',
    'pbs', 'nasa', 'cbc news', 'cp24', 'global news', 'citynews', 'ctv',
    'espn', 'tsn', 'sportsnet'
];

const ENGLISH_BLOCKLIST = [
    'espanol', 'spanish', 'latino', 'francais', 'french', 'portugues', 'portuguese',
    'deutsch', 'german', 'italiano', 'italian', 'arabic', 'hindi', 'urdu', 'persian', 'farsi', 'turkish', 'russian'
];

const FOREIGN_TLDS = ['.ir', '.pk', '.af', '.tr', '.sa', '.ae', '.eg', '.in', '.ru', '.vn', '.cn', '.bd', '.il', '.br', '.it', '.de', '.fr', '.es'];

function isPrivateIPv4(hostname) {
    const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return false;

    const a = Number(match[1]);
    const b = Number(match[2]);

    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
}

function isPrivateOrLocalHost(hostname) {
    const host = (hostname || '').toLowerCase();
    if (!host) return true;
    if (host === 'localhost' || host.endsWith('.localhost')) return true;
    if (host === '::1' || host.startsWith('fe80:')) return true;
    if (host.startsWith('fc') || host.startsWith('fd')) return true;
    return isPrivateIPv4(host);
}

export const IPTVAdapter = {
    normalizeName(rawName) {
        return (rawName || '')
            .replace(/\(.*\)/g, '')
            .replace(/\[.*\]/g, '')
            .replace(/1080p|720p|fhd|hd|sd|uhd/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    isEnglishChannel(name, originalCategory, tvgLanguage) {
        const n = (name || '').toLowerCase();
        const c = (originalCategory || '').toLowerCase();
        const lang = (tvgLanguage || '').toLowerCase();

        if (ENGLISH_BLOCKLIST.some((kw) => n.includes(kw) || c.includes(kw) || lang.includes(kw))) {
            return false;
        }

        if (!lang) return true;
        return lang.includes('en') || lang.includes('eng') || lang.includes('english');
    },

    isForeignHeuristic(name, logo, tvgId, originalCategory) {
        const n = (name || '').toLowerCase();
        const l = (logo || '').toLowerCase();
        const t = (tvgId || '').toLowerCase();
        const c = (originalCategory || '').toLowerCase();

        if (ENGLISH_BLOCKLIST.some((kw) => n.includes(kw) || l.includes(kw) || t.includes(kw) || c.includes(kw))) {
            return true;
        }

        try {
            if (l.startsWith('http')) {
                const url = new URL(l);
                if (FOREIGN_TLDS.some((tld) => url.hostname.endsWith(tld))) return true;
            }
        } catch {
            // ignore bad logo URLs
        }

        return false;
    },

    getCategoryByContent(name, originalCategory, logo, tvgId) {
        const n = (name || '').toLowerCase();
        const oc = (originalCategory || '').toLowerCase();

        if (this.isForeignHeuristic(name, logo, tvgId, originalCategory)) {
            return 'Foreign';
        }

        for (const [cat, keywords] of Object.entries(CONTENT_MAPPING)) {
            if (keywords.some((kw) => n.includes(kw) || oc.includes(kw))) {
                return cat;
            }
        }
        return 'General';
    },

    isPremiumChannel(name) {
        const premiumKeywords = [
            'abc', 'cbs', 'nbc', 'fox', 'pbs', 'cnn', 'msnbc', 'cnbc', 'bloomberg',
            'cbc', 'cp24', 'ctv', 'global', 'citynews', 'espn', 'tsn', 'sportsnet', 'nasa'
        ];
        const n = (name || '').toLowerCase();
        return premiumKeywords.some((kw) => n.includes(kw));
    },

    isFeaturedChannel(name) {
        const n = (name || '').toLowerCase();
        return FEATURED_ENGLISH_KEYWORDS.some((kw) => n.includes(kw));
    },

    isAllowedStreamUrl(rawUrl) {
        try {
            const url = new URL(rawUrl);
            if (!['http:', 'https:'].includes(url.protocol)) return false;
            if (isPrivateOrLocalHost(url.hostname)) return false;
            return true;
        } catch {
            return false;
        }
    },

    async fetchCanadaChannels() {
        const rawChannels = [];

        await Promise.all(M3U_SOURCES.map(async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) return;
                const m3uText = await response.text();
                rawChannels.push(...this.parseM3U(m3uText));
            } catch (e) {
                console.error(`[IPTV] Source error: ${url}`, e.message);
            }
        }));

        const normalizedMap = new Map();

        for (const ch of rawChannels) {
            const baseName = this.normalizeName(ch.name || 'Unknown');
            if (!baseName) continue;

            if (!this.isEnglishChannel(baseName, ch.category, ch.tvgLanguage)) continue;

            const category = this.getCategoryByContent(baseName, ch.category, ch.logo, ch.tvgId);
            if (category === 'Foreign') continue;

            const isPremium = this.isPremiumChannel(baseName);
            const isFeatured = this.isFeaturedChannel(baseName);

            if (!normalizedMap.has(baseName)) {
                normalizedMap.set(baseName, {
                    id: `ch-${baseName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: baseName,
                    category,
                    isPremium,
                    isFeatured,
                    logo: ch.logo,
                    sources: []
                });
            }

            const existing = normalizedMap.get(baseName);
            existing.isFeatured = existing.isFeatured || isFeatured;
            if (ch.logo && !existing.logo) existing.logo = ch.logo;

            if (!existing.sources.find((s) => s.url === ch.url)) {
                existing.sources.push({
                    url: ch.url,
                    label: ch.name,
                    qualityScore: ch.qualityScore,
                    tvgId: ch.tvgId
                });
            }
        }

        const aggregated = Array.from(normalizedMap.values())
            .filter((ch) => ch.sources.length > 0 && ch.category !== 'Foreign')
            .sort((a, b) => {
                if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
                if (a.isPremium !== b.isPremium) return b.isPremium ? 1 : -1;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 260);

        return aggregated;
    },

    parseM3U(text) {
        const lines = text.split('\n');
        const channels = [];
        let currentChannel = null;

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('#EXTINF:')) {
                currentChannel = { qualityScore: 0 };

                const commaIndex = line.lastIndexOf(',');
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

                const langMatch = line.match(/tvg-language="([^"]+)"/);
                if (langMatch) currentChannel.tvgLanguage = langMatch[1];
            } else if (line.startsWith('http') && currentChannel) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }

        return channels;
    },

    async validateStream(url) {
        const start = Date.now();
        if (!this.isAllowedStreamUrl(url)) {
            return { isValid: false, latency: 9999 };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        try {
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const latency = Date.now() - start;
            if (response.ok || response.status === 206) return { isValid: true, latency };

            if (response.status === 403 || response.status === 405) {
                const fallback = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0', Range: 'bytes=0-1' }
                });

                if (fallback.ok || fallback.status === 206) {
                    return { isValid: true, latency: Date.now() - start };
                }
            }

            return { isValid: false, latency: 9999 };
        } catch {
            return { isValid: false, latency: 9999 };
        } finally {
            clearTimeout(timeoutId);
        }
    },

    async getVerifiedChannels() {
        const allChannels = await this.fetchCanadaChannels();
        const verifiedGroups = [];

        const featured = allChannels.filter((c) => c.isFeatured);
        const premium = allChannels.filter((c) => c.isPremium && !c.isFeatured);
        const normal = allChannels.filter((c) => !c.isPremium && !c.isFeatured).slice(0, 120);
        const pool = [...featured, ...premium, ...normal];

        const batchSize = 10;
        for (let i = 0; i < pool.length; i += batchSize) {
            const batch = pool.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(async (group) => {
                const checks = await Promise.all(
                    group.sources.slice(0, 4).map(async (src) => {
                        const check = await this.validateStream(src.url);
                        return check.isValid ? { ...src, latency: check.latency } : null;
                    })
                );

                const validSources = checks.filter(Boolean);
                if (validSources.length > 0) {
                    validSources.sort((a, b) => (b.qualityScore - a.qualityScore) || (a.latency - b.latency));
                    return { ...group, sources: validSources, url: validSources[0].url };
                }
                return null;
            }));

            verifiedGroups.push(...results.filter(Boolean));
            if (verifiedGroups.length >= 180) break;
        }

        return verifiedGroups.sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
            if (a.isPremium !== b.isPremium) return b.isPremium ? 1 : -1;
            return a.category.localeCompare(b.category);
        });
    }
};
