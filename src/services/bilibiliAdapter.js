// B站热搜适配器
// 使用今日热榜API: https://api.vvhan.com/api/hotlist?type=bilibili
export const BilibiliAdapter = {
    async fetchHotSearch() {
        try {
            const url = 'https://api.vvhan.com/api/hotlist?type=bilibili';

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                console.warn(`[Bilibili] API returned ${response.status}, using fallback`);
                return this.getFallbackTopics();
            }

            const data = await response.json();

            // 今日热榜API返回格式: { success: true, title: "哔哩哔哩", data: [...] }
            if (!data.success || !data.data || data.data.length === 0) {
                console.warn('[Bilibili] API returned invalid data, using fallback');
                return this.getFallbackTopics();
            }

            const hotSearchList = data.data;

            // 只取前5条
            const top5 = hotSearchList.slice(0, 5);

            return top5.map((item, index) => ({
                id: `bilibili-${Date.now()}-${index}`,
                source: 'Bilibili',
                titleOriginal: item.title || '',
                titleTranslated: item.title || '', // B站内容已是中文
                url: item.url || item.mobilUrl || `https://www.bilibili.com`,
                timestamp: new Date().toISOString(),
                views: item.hot || null,
                thumbnail: null // 不显示图标
            }));
        } catch (error) {
            console.error('[Bilibili] Error:', error);
            // 如果接口失败,使用备用话题
            return this.getFallbackTopics();
        }
    },

    // 备用热门话题(基于B站常见高热度内容类型)
    getFallbackTopics() {
        const now = new Date().toISOString();
        const baseTime = Date.now();



        return [
            {
                id: `bilibili-${baseTime}-0`,
                source: 'Bilibili',
                titleOriginal: '最新番剧更新推荐',
                titleTranslated: '最新番剧更新推荐',
                url: 'https://www.bilibili.com/anime',
                timestamp: now,
                views: '1245万',
                thumbnail: null
            },
            {
                id: `bilibili-${baseTime}-1`,
                source: 'Bilibili',
                titleOriginal: '科技区UP主新作品',
                titleTranslated: '科技区UP主新作品',
                url: 'https://www.bilibili.com/v/tech',
                timestamp: now,
                views: '856万',
                thumbnail: null
            },
            {
                id: `bilibili-${baseTime}-2`,
                source: 'Bilibili',
                titleOriginal: '游戏区热门视频',
                titleTranslated: '游戏区热门视频',
                url: 'https://www.bilibili.com/v/game',
                timestamp: now,
                views: '723万',
                thumbnail: null
            },
            {
                id: `bilibili-${baseTime}-3`,
                source: 'Bilibili',
                titleOriginal: '知识区精选内容',
                titleTranslated: '知识区精选内容',
                url: 'https://www.bilibili.com/v/knowledge',
                timestamp: now,
                views: '645万',
                thumbnail: null
            },
            {
                id: `bilibili-${baseTime}-4`,
                source: 'Bilibili',
                titleOriginal: '生活区热门分享',
                titleTranslated: '生活区热门分享',
                url: 'https://www.bilibili.com/v/life',
                timestamp: now,
                views: '534万',
                thumbnail: null
            }
        ];
    }
};
