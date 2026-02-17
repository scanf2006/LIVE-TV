// YouTube热门视频适配器
// 获取热门视频前20个
import * as Sentry from "@sentry/nextjs";

export const YouTubeAdapter = {
    async fetchTrending() {
        try {
            const apiKey = process.env.YOUTUBE_API_KEY || '';

            if (!apiKey) {
                return this.getFallbackVideos();
            }

            // YouTube Data API v3 - 获取热门视频(前20个)
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${apiKey}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[YouTube] API error (${response.status}):`, errorText);

                // 发送到Sentry
                Sentry.captureException(new Error(`YouTube API error: ${response.status}`), {
                    tags: {
                        adapter: 'YouTube',
                        action: 'fetchTrending',
                        status: response.status
                    },
                    extra: {
                        errorText: errorText.substring(0, 500),
                        apiKeyPresent: !!apiKey
                    }
                });

                return this.getFallbackVideos();
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                console.error('[YouTube] No items returned');
                return this.getFallbackVideos();
            }

            return data.items.map((item, index) => ({
                id: `youtube-${item.id}-${index}`,
                source: 'YouTube',
                titleOriginal: item.snippet.title,
                titleTranslated: null,
                url: `https://www.youtube.com/watch?v=${item.id}`,
                timestamp: item.snippet.publishedAt || new Date().toISOString(),
                views: this.formatViews(item.statistics?.viewCount),
                thumbnail: null
            }));
        } catch (error) {
            console.error('[YouTube] Exception:', error.message);

            // 发送到Sentry
            Sentry.captureException(error, {
                tags: {
                    adapter: 'YouTube',
                    action: 'fetchTrending'
                },
                extra: {
                    errorMessage: error.message
                }
            });

            return this.getFallbackVideos();
        }
    },

    // 格式化观看次数
    formatViews(viewCount) {
        if (!viewCount) return '0';
        const count = parseInt(viewCount);
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    },

    // 备用热门视频(当API不可用时)
    getFallbackVideos() {
        const now = new Date().toISOString();
        const baseTime = Date.now();

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
