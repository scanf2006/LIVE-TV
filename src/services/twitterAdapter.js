import * as cheerio from 'cheerio';

export const TwitterAdapter = {
    async fetchTrending() {
        try {
            // 使用 getdaytrends.com 作为主要数据源
            // 备用: us.trend-calendar.com (如果主源失败)
            const sources = [
                'https://getdaytrends.com/', // Root page
                'https://us.trend-calendar.com/'
            ];

            for (const url of sources) {
                try {
                    console.log(`[TwitterAdapter] Fetching from ${url}`);
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                        }
                    });

                    if (!response.ok) {
                        console.warn(`[TwitterAdapter] Failed to fetch ${url}: ${response.status}`);
                        continue;
                    }

                    const html = await response.text();
                    const $ = cheerio.load(html);
                    const trends = [];

                    if (url.includes('getdaytrends.com')) {
                        // 解析 getdaytrends.com
                        // 通常在 table.table-hover 或类似结构中
                        $('table tbody tr').each((i, el) => {
                            if (i >= 20) return false; // 限制20条

                            const link = $(el).find('a').first();
                            const title = link.text().trim();
                            const countText = $(el).find('.small.text-muted').text().trim(); // Tweet count usually here

                            if (title) {
                                trends.push({
                                    id: `twitter-${i}-${Date.now()}`,
                                    source: 'X (Twitter)',
                                    titleOriginal: title,
                                    titleTranslated: null,
                                    url: `https://twitter.com/search?q=${encodeURIComponent(title)}`,
                                    timestamp: new Date().toISOString(),
                                    views: countText || 'Trending',
                                    thumbnail: null
                                });
                            }
                        });
                    } else {
                        // 解析 trend-calendar.com
                        $('.cw-list-item').each((i, el) => {
                            if (i >= 20) return false;
                            const title = $(el).find('.cw-list-name').text().trim();
                            if (title) {
                                trends.push({
                                    id: `twitter-backup-${i}-${Date.now()}`,
                                    source: 'X (Twitter)',
                                    titleOriginal: title,
                                    titleTranslated: null,
                                    url: `https://twitter.com/search?q=${encodeURIComponent(title)}`,
                                    timestamp: new Date().toISOString(),
                                    views: 'Trending',
                                    thumbnail: null
                                });
                            }
                        });
                    }

                    if (trends.length > 0) {
                        console.log(`[TwitterAdapter] Successfully fetched ${trends.length} items from ${url}`);
                        return trends;
                    }

                } catch (innerErr) {
                    console.error(`[TwitterAdapter] Error parsing ${url}:`, innerErr);
                }
            }

            return [];

        } catch (error) {
            console.error('[TwitterAdapter] Critical Error:', error);
            return [];
        }
    }
};
