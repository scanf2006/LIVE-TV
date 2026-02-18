import Parser from 'rss-parser';

const parser = new Parser();

export const RedditAdapter = {
    async fetchTrending() {
        try {
            // Step 1: Manual fetch to ensure User-Agent and headers are correctly sent
            const response = await fetch('https://www.reddit.com/r/popular/.rss', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.1'
                }
            });

            if (!response.ok) {
                console.warn(`[RedditAdapter] Fetch failed: ${response.status} ${response.statusText}`);
                return [];
            }

            const xmlText = await response.text();

            // Step 2: Use rss-parser to parse the fetched XML string
            const feed = await parser.parseString(xmlText);

            if (!feed.items || feed.items.length === 0) {
                console.warn('[RedditAdapter] No items found in RSS feed after parsing');
                return [];
            }

            return feed.items.slice(0, 20).map((item, index) => ({
                id: `reddit-rss-${index}-${Date.now()}`,
                source: 'Reddit',
                titleOriginal: item.title,
                titleTranslated: null,
                url: item.link,
                timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                views: 'Trending',
                thumbnail: null
            }));

        } catch (error) {
            console.error('RedditAdapter (RSS-Fetch) Error:', error);
            return [];
        }
    }
};
