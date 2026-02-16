export const WeiboAdapter = {
    async fetchHotSearch() {
        try {
            const response = await fetch("https://weibo.com/ajax/side/hotSearch", {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                console.warn("Weibo API returned status:", response.status);
                return this.getFallbackData();
            }

            const data = await response.json();

            if (data.ok === 1 && data.data && data.data.realtime) {
                const hotSearchList = data.data.realtime;
                const top10 = hotSearchList.slice(0, 10);

                return top10.map((item, index) => ({
                    id: "weibo-" + item.word + "-" + Date.now(),
                    title: item.word,
                    url: "https://s.weibo.com/weibo?q=" + encodeURIComponent(item.word),
                    source: "微博热搜",
                    rank: index + 1,
                    views: item.num || 0
                }));
            }

            return this.getFallbackData();
        } catch (error) {
            console.error("Failed to fetch Weibo hot search:", error);
            return this.getFallbackData();
        }
    },

    getFallbackData() {
        // 返回一些示例数据作为后备
        return [
            {
                id: "weibo-fallback-1-" + Date.now(),
                title: "微博热搜数据加载中...",
                url: "https://weibo.com",
                source: "微博热搜",
                rank: 1,
                views: 0
            }
        ];
    }
};
