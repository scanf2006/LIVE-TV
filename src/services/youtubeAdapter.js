// YouTube热门视频适配器
// 使用YouTube Data API v3获取前10热门视频
export const YouTubeAdapter = {
    async fetchTrending() {
        console.log('[YouTube] Starting fetchTrending...');
        try {
            const apiKey = process.env.YOUTUBE_API_KEY || '';

            console.log('[YouTube] API Key status:', apiKey ? `Found (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})` : 'NOT FOUND');

            if (!apiKey) {
                console.warn('[YouTube] API key not configured, using fallback videos');
                return this.getFallbackVideos();
            }

            // YouTube Data API v3 - 获取美国/加拿大热门视频
            const regionCode = 'US'; // 可选: US, CA, GB等
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=10&key=${apiKey}`;

            console.log('[YouTube] Fetching from API...');

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('[YouTube] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[YouTube] API error (${response.status}):`, errorText);
                return this.getFallbackVideos();
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                console.warn('[YouTube] API returned no items');
                console.warn('[YouTube] Response data:', JSON.stringify(data));
                return this.getFallbackVideos();
            }

            console.log('[YouTube] Successfully fetched', data.items.length, 'videos');
            console.log('[YouTube] First video:', data.items[0]?.snippet?.title);

            return data.items.map((item, index) => ({
                id: `youtube-${item.id}-${index}`,
                source: 'YouTube',
                titleOriginal: item.snippet.title,
                titleTranslated: null, // 需要翻译
                url: `https://www.youtube.com/watch?v=${item.id}`,
                timestamp: item.snippet.publishedAt || new Date().toISOString(),
                views: this.formatViews(item.statistics?.viewCount),
                thumbnail: null // 不显示缩略图,保持一致性
            }));
        } catch (error) {
            console.error('[YouTube] Exception:', error.message);
            console.error('[YouTube] Stack:', error.stack);
            return this.getFallbackVideos();
        }
    },

    // 格式化观看次数
    formatViews(viewCount) {
        if (!viewCount) return null;

        const count = parseInt(viewCount);
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    },

    // 备用热门视频(当API不可用时)
    getFallbackVideos() {
        const now = new Date().toISOString();
        const baseTime = Date.now();

        console.log('[YouTube] Returning fallback videos');

        return [
            {
                id: `youtube-${baseTime}-0`,
                source: 'YouTube',
                titleOriginal: 'Top Tech Reviews & Unboxing Videos',
                titleTranslated: null,
                url: 'https://www.youtube.com/results?search_query=tech+review',
                timestamp: now,
                views: '5.2M',
                thumbnail: null
            },
            {
                id: `youtube-${baseTime}-1`,
                source: 'YouTube',
                titleOriginal: 'Latest Gaming Highlights & Walkthroughs',
                titleTranslated: null,
                url: 'https://www.youtube.com/gaming',
                timestamp: now,
                views: '3.8M',
                thumbnail: null
            },
            {
                id: `youtube-${baseTime}-2`,
                source: 'YouTube',
                titleOriginal: 'Trending Music Videos & Performances',
                titleTranslated: null,
                url: 'https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ',
                timestamp: now,
                views: '4.5M',
                thumbnail: null
            },
            {
                id: `youtube-${baseTime}-3`,
                source: 'YouTube',
                titleOriginal: 'Breaking News & Current Events',
                titleTranslated: null,
                url: 'https://www.youtube.com/results?search_query=breaking+news',
                timestamp: now,
                views: '2.1M',
                thumbnail: null
            },
            {
                id: `youtube-${baseTime}-4`,
                source: 'YouTube',
                titleOriginal: 'Popular Entertainment & Comedy',
                titleTranslated: null,
                url: 'https://www.youtube.com/feed/trending',
                timestamp: now,
                views: '6.3M',
                thumbnail: null
            }
        ];
    }
};
