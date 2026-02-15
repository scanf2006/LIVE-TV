export const XiaohongshuAdapter = {
    async fetchHotTopics() {
        try {
            // 使用顺为数据的小红书热榜API
            // API密钥从环境变量读取
            const apiKey = process.env.XIAOHONGSHU_API_KEY || '';

            if (!apiKey) {
                console.warn('Xiaohongshu API key not configured, using curated topics');
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
                console.warn(`Xiaohongshu API returned ${response.status}, using curated topics`);
                return this.getCuratedHotTopics();
            }

            const data = await response.json();

            // 顺为数据API返回格式: { code: 200, data: [ { rank, name, date, viewnum, icon, word_type, url } ] }
            if (data.code !== 200 || !data.data || data.data.length === 0) {
                console.warn('Xiaohongshu API returned invalid data, using curated topics');
                return this.getCuratedHotTopics();
            }

            const hotTopics = data.data;

            // 只取前5条
            const top5 = hotTopics.slice(0, 5);

            return top5.map((item, index) => ({
                id: `xiaohongshu-${Date.now()}-${index}`,
                source: 'Xiaohongshu',
                titleOriginal: item.name || '',
                titleTranslated: item.name || '',
                url: item.url || `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.name || '')}`,
                timestamp: new Date().toISOString(),
                views: item.viewnum || null,
                thumbnail: null  // 不显示图标
            }));
        } catch (error) {
            console.error('XiaohongshuAdapter Error:', error);
            // 如果接口失败,使用精选话题
            return this.getCuratedHotTopics();
        }
    },

    // 精选热门话题(备用数据)
    getCuratedHotTopics() {
        const now = new Date().toISOString();
        const baseTime = Date.now();

        return [
            {
                id: `xiaohongshu-${baseTime}-0`,
                source: 'Xiaohongshu',
                titleOriginal: '春节出游攻略',
                titleTranslated: '春节出游攻略',
                url: 'https://www.xiaohongshu.com/search_result?keyword=春节出游攻略',
                timestamp: now,
                views: '128.5万',
                thumbnail: null
            },
            {
                id: `xiaohongshu-${baseTime}-1`,
                source: 'Xiaohongshu',
                titleOriginal: '护肤品测评',
                titleTranslated: '护肤品测评',
                url: 'https://www.xiaohongshu.com/search_result?keyword=护肤品测评',
                timestamp: now,
                views: '95.2万',
                thumbnail: null
            },
            {
                id: `xiaohongshu-${baseTime}-2`,
                source: 'Xiaohongshu',
                titleOriginal: '健身打卡',
                titleTranslated: '健身打卡',
                url: 'https://www.xiaohongshu.com/search_result?keyword=健身打卡',
                timestamp: now,
                views: '76.8万',
                thumbnail: null
            },
            {
                id: `xiaohongshu-${baseTime}-3`,
                source: 'Xiaohongshu',
                titleOriginal: '美食探店',
                titleTranslated: '美食探店',
                url: 'https://www.xiaohongshu.com/search_result?keyword=美食探店',
                timestamp: now,
                views: '64.3万',
                thumbnail: null
            },
            {
                id: `xiaohongshu-${baseTime}-4`,
                source: 'Xiaohongshu',
                titleOriginal: '穿搭灵感',
                titleTranslated: '穿搭灵感',
                url: 'https://www.xiaohongshu.com/search_result?keyword=穿搭灵感',
                timestamp: now,
                views: '52.7万',
                thumbnail: null
            }
        ];
    }
};
