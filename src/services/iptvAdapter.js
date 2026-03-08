/**
 * Global IPTV adapter.
 * Aggregates multi-source M3U channels, classifies content, and validates stream availability.
 */

const M3U_SOURCES = [
    'https://iptv-org.github.io/iptv/countries/uk.m3u',
    'https://iptv-org.github.io/iptv/countries/us.m3u',
    'https://iptv-org.github.io/iptv/countries/ca.m3u',
    'https://iptv-org.github.io/iptv/countries/au.m3u',
    'https://iptv-org.github.io/iptv/countries/nz.m3u',
    'https://iptv-org.github.io/iptv/countries/ie.m3u',
    'https://iptv-org.github.io/iptv/countries/ph.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_firetv.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_klowdtv.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pbs.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_tubi.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_plex.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_samsung.m3u',
    'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_canada.m3u8',
    'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_usa.m3u8'
];

const CONTENT_MAPPING = {
    News: ['news', 'bbc news', 'cnn', 'msnbc', 'reuters', 'bloomberg', 'cnbc', 'al jazeera', 'sky news', 'citynews', 'cbc news'],
    Sports: ['sports', 'espn', 'tsn', 'stadium', 'fifa', 'f1', 'golf', 'football', 'nba', 'ufc', 'fight'],
    Movies: ['movie', 'hbo', 'amc', 'cinema', 'film', 'star movies', 'paramount'],
    Documentary: ['discovery', 'history', 'nasa', 'national geographic', 'nat geo', 'animal planet', 'science', 'nature', 'curiosity'],
    Entertainment: ['entertainment', 'comedy', 'mtv', 'tnt', 'tbs', 'abc', 'cbs', 'nbc', 'fox', 'bbc', 'itv', 'channel 4', 'channel 5', 'hgtv', 'food'],
    Kids: ['kids', 'nick', 'disney', 'cartoon', 'cbeebies', 'pop', 'boing', 'baby'],
    Music: ['music', 'mtv', 'v2beat', 'stingray', 'concert']
};

const FOREIGN_KEYWORDS = ['pashto', 'persian', 'iran', 'farsi', 'arabic', 'urdu', 'bengali', 'tamil', 'punjabi', 'turkish', 'hindi', 'afghan', 'espanol', 'spanish', 'norsk', 'polonia'];
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
        const name = (rawName || '')
            .replace(/\(.*\)/g, '')
            .replace(/\[.*\]/g, '')
            .replace(/1080p|720p|fhd|hd|sd/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        const lower = name.toLowerCase();
        if (lower.includes('news live') || lower.includes('news now') || lower.includes('international') || lower.includes('world')) {
            return name;
        }

        const brands = ['abc', 'nbc', 'cbs', 'fox', 'pbs', 'bbc', 'cbc', 'itv', 'sky', 'cnn', 'hsn', 'qvc', 'global', 'ctv', 'citynews'];
        for (const b of brands) {
            const brandRegex = new RegExp(`^${b}(\\s+\\d+|\\s+[a-z]+|\\s*-\\s*[a-z]+)`, 'i');
            if (brandRegex.test(name)) {
                if (b === 'bbc') {
                    const bbcSeq = name.match(/^bbc\s+(one|two|three|four|news|hd|alba|parliament)/i);
                    if (bbcSeq) return bbcSeq[0].toUpperCase();
                }
                if (b === 'cbc' && lower.includes('network')) return 'CBC News Network';
                return b.toUpperCase();
            }
        }

        return name;
    },

    isForeignHeuristic(name, logo, tvgId, originalCategory) {
        const n = (name || '').toLowerCase();
        const l = (logo || '').toLowerCase();
        const t = (tvgId || '').toLowerCase();
        const c = (originalCategory || '').toLowerCase();

        if (FOREIGN_KEYWORDS.some((kw) => n.includes(kw) || l.includes(kw) || t.includes(kw) || c.includes(kw))) {
            return true;
        }

        try {
            if (l.startsWith('http')) {
                const url = new URL(l);
                const hostname = url.hostname;
                if (FOREIGN_TLDS.some((tld) => hostname.endsWith(tld))) {
                    return true;
                }
            }
        } catch {
            // Ignore invalid logo URL.
        }

        const foreignIdRegex = /\.@(?!us|uk|ca|en|com|org|net|edu|int)[a-z]{2,3}$/;
        if (foreignIdRegex.test(t)) return true;
        if (t.includes('.ir@') || t.includes('.pk@') || t.includes('.tr@')) return true;

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

    isPremiumChannel(name, logo, tvgId) {
        const premiumKeywords = ['cnn', 'bbc', 'hbo', 'discovery', 'history', 'star', 'espn', 'tsn', 'abc', 'nbc', 'cbs', 'fox'];
        const n = (name || '').toLowerCase();

        if (this.isForeignHeuristic(name, logo, tvgId)) return false;
        return premiumKeywords.some((kw) => n.includes(kw));
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
                const parsed = this.parseM3U(m3uText);
                rawChannels.push(...parsed);
            } catch (e) {
                console.error(`[IPTV] Source error: ${url}`, e.message);
            }
        }));

        const normalizedMap = new Map();

        for (const ch of rawChannels) {
            const rawName = ch.name || 'Unknown';
            const baseName = this.normalizeName(rawName);
            if (!baseName) continue;

            const category = this.getCategoryByContent(baseName, ch.category, ch.logo, ch.tvgId);
            if (category === 'Foreign') continue;

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
            if (!existing.sources.find((s) => s.url === ch.url)) {
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
        return aggregated
            .filter((ch) => (ch.isPremium ? true : ch.sources.length > 0 && ch.category !== 'General'))
            .slice(0, 300);
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

            // Some streams block HEAD but allow GET.
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

        const premiumOnes = allChannels.filter((c) => c.isPremium);
        const normalOnes = allChannels.filter((c) => !c.isPremium).slice(0, 200);
        const pool = [...premiumOnes, ...normalOnes];

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
            if (verifiedGroups.length >= 200) break;
        }

        return verifiedGroups.sort((a, b) => {
            if (a.isPremium !== b.isPremium) return b.isPremium ? -1 : 1;
            return a.category.localeCompare(b.category);
        });
    }
};
