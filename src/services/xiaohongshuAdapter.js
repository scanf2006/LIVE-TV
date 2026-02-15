export const XiaohongshuAdapter = {
    async fetchHotTopics() {
        try {
            // 尝试从小红书热搜榜获取数据
            // 小红书的热搜接口可能需要特定的headers和参数
            const url = 'https://www.xiaohongshu.com/web_api/sns/v1/search/hot_list';

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.xiaohongshu.com',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`Xiaohongshu API returned ${response.status}, using fallback`);
                return this.getFallbackData();
            }

            const data = await response.json();

            // 小红书API返回格式可能为: { data: { items: [ { id, title, ... } ] } }
            const hotTopics = data?.data?.items || data?.items || [];

            // 只取前5条
            const top5 = hotTopics.slice(0, 5);

            return top5.map((item, index) => ({
                id: `xiaohongshu-${Date.now()}-${index}`,
                source: 'Xiaohongshu',
                titleOriginal: item.title || item.query || item.word || '',
                titleTranslated: item.title || item.query || item.word || '', // 小红书已是中文
                url: item.link || `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title || item.query || '')}`,
                timestamp: new Date().toISOString(),
                views: item.hot_value || item.view_count || null,
                thumbnail: item.cover || item.image || null
            }));
        } catch (error) {
            console.error('XiaohongshuAdapter Error:', error);
            // 如果接口失败,返回空数组
            return [];
        }
    },

    // 备用数据(如果API失败)
    getFallbackData() {
        return [];
    }
};
