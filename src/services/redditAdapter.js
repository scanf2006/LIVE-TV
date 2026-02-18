export const RedditAdapter = {
    async fetchTrending() {
        try {
            const response = await fetch('https://www.reddit.com/r/popular.json?limit=20', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const data = await response.json();

            return data.data.children.map(child => {
                const item = child.data;
                return {
                    id: `reddit-${item.id}`,
                    source: 'Reddit',
                    titleOriginal: item.title,
                    titleTranslated: null, // Will be translated later
                    url: `https://www.reddit.com${item.permalink}`,
                    timestamp: new Date(item.created_utc * 1000).toISOString(),
                    views: item.score, // Use score as proxy for views/popularity
                    thumbnail: null // User requested titles only, no thumbnails
                };
            });
        } catch (error) {
            console.error('RedditAdapter Error:', error);
            return [];
        }
    }
};
