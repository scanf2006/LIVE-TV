export const ZhihuAdapter = {
    async fetchHotTopics() {
        try {
            const response = await fetch("https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=10", {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                console.warn("Zhihu API returned status:", response.status);
                return this.getFallbackData();
            }

            const data = await response.json();

            if (data.data) {
                const hotTopics = data.data;
                const top10 = hotTopics.slice(0, 10);

                return top10.map((item, index) => ({
                    id: "zhihu-" + item.target.id + "-" + Date.now(),
                    title: item.target.title,
                    url: "https://www.zhihu.com/question/" + item.target.id,
                    source: "知乎热榜",
                    rank: index + 1,
                    views: item.detail_text || 0
                }));
            }

            return this.getFallbackData();
        } catch (error) {
            console.error("Failed to fetch Zhihu hot topics:", error);
            return this.getFallbackData();
        }
    },

    getFallbackData() {
        // 返回一些示例数据作为后备
        return [
            {
                id: "zhihu-fallback-1-" + Date.now(),
                title: "知乎热榜数据加载中...",
                url: "https://www.zhihu.com",
                source: "知乎热榜",
                rank: 1,
                views: 0
            }
        ];
    }
};
