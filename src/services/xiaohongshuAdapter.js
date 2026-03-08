export const XiaohongshuAdapter = {
    async fetchHotTopics() {
        try {
            const apiKey = process.env.XIAOHONGSHU_API_KEY || '';

            if (!apiKey) {
                console.warn('[Xiaohongshu] API key not configured, using curated topics');
                return this.getCuratedHotTopics();
            }

            const url = `https://api.itapi.cn/api/hotnews/xiaohongshu?key=${apiKey}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                console.warn(`[Xiaohongshu] API returned ${response.status}, using curated topics`);
                return this.getCuratedHotTopics();
            }

            const data = await response.json();
            if (data.code !== 200 || !data.data || data.data.length === 0) {
                console.warn('[Xiaohongshu] API returned invalid data, using curated topics');
                return this.getCuratedHotTopics();
            }

            return data.data.slice(0, 10).map((item, index) => ({
                id: `xiaohongshu-${Date.now()}-${index}`,
                source: 'Xiaohongshu',
                titleOriginal: item.name || '',
                titleTranslated: item.name || '',
                url: item.url || `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.name || '')}`,
                timestamp: new Date().toISOString(),
                views: item.viewnum || null,
                thumbnail: null
            }));
        } catch (error) {
            console.error('[Xiaohongshu] Error:', error);
            return this.getCuratedHotTopics();
        }
    },

    getCuratedHotTopics() {
        const now = new Date().toISOString();
        const baseTime = Date.now();
        const topics = [
            { title: 'Spring travel ideas', views: '128.5M' },
            { title: 'Skincare product reviews', views: '95.2M' },
            { title: 'Home workout routines', views: '76.8M' },
            { title: 'City food discoveries', views: '64.3M' },
            { title: 'Daily outfit inspiration', views: '52.7M' }
        ];

        return topics.map((topic, index) => ({
            id: `xiaohongshu-${baseTime}-${index}`,
            source: 'Xiaohongshu',
            titleOriginal: topic.title,
            titleTranslated: topic.title,
            url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(topic.title)}`,
            timestamp: now,
            views: topic.views,
            thumbnail: null
        }));
    }
};
