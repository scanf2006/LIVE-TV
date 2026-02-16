// 微博热搜适配器 - 使用GitHub开源项目数据
// 数据来源: https://github.com/justjavac/weibo-trending-hot-search
export const WeiboAdapter = {
    async fetchHotSearch() {
        try {
            // 方案1: 使用GitHub Pages托管的最新数据
            const response = await fetch(
                'https://weibo-trending-hot-search.pages.dev/hot-search.json',
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                console.warn('GitHub Weibo data failed, trying backup...');
                return this.tryBackupSource();
            }

            const data = await response.json();

            // 数据格式: { data: [{ title, url, hot }] }
            if (data && Array.isArray(data)) {
                return data.slice(0, 10).map((item, index) => ({
                    id: "weibo-github-" + (item.title || item.word) + "-" + Date.now(),
                    title: item.title || item.word,
                    url: item.url || "https://s.weibo.com/weibo?q=" + encodeURIComponent(item.title || item.word),
                    source: "微博热搜",
                    rank: index + 1,
                    views: item.hot || item.num || 0
                }));
            }

            return this.tryBackupSource();
        } catch (error) {
            console.error("Failed to fetch Weibo from GitHub:", error);
            return this.tryBackupSource();
        }
    },

    async tryBackupSource() {
        // 备用方案: 使用vvhan API
        try {
            const response = await fetch('https://api.vvhan.com/api/hotlist/weiboHot');
            const data = await response.json();

            if (data.success && data.data) {
                return data.data.slice(0, 10).map((item, index) => ({
                    id: "weibo-vvhan-" + item.title + "-" + Date.now(),
                    title: item.title,
                    url: item.url,
                    source: "微博热搜",
                    rank: index + 1,
                    views: item.hot || 0
                }));
            }
        } catch (error) {
            console.warn("Backup source also failed:", error);
        }

        return this.getFallbackData();
    },

    getFallbackData() {
        // 最后的后备数据
        return [
            {
                id: "weibo-fallback-" + Date.now(),
                title: "微博热搜数据加载中...",
                url: "https://weibo.com",
                source: "微博热搜",
                rank: 1,
                views: 0
            }
        ];
    }
};
