// 微博热搜适配器 - 使用多个可靠数据源
export const WeiboAdapter = {
    async fetchHotSearch() {
        // 方案1: 使用vvhan API (最稳定)
        try {
            const response = await fetch('https://api.vvhan.com/api/hotlist/weiboHot');
            const data = await response.json();

            console.log('Weibo vvhan response:', data);

            if (data.success && data.data && Array.isArray(data.data)) {
                return data.data.slice(0, 10).map((item, index) => ({
                    id: "weibo-vvhan-" + index + "-" + Date.now(),
                    title: item.title,
                    url: item.url,
                    source: "微博热搜",
                    rank: index + 1,
                    views: item.hot || 0,
                    titleOriginal: item.title
                }));
            }
        } catch (error) {
            console.warn('vvhan API failed:', error);
        }

        // 方案2: 使用天行数据API (需要key但有免费额度)
        try {
            const response = await fetch('https://api.oioweb.cn/api/common/HotList?type=weibo');
            const data = await response.json();

            console.log('Weibo oioweb response:', data);

            if (data.code === 200 && data.result && Array.isArray(data.result.list)) {
                return data.result.list.slice(0, 10).map((item, index) => ({
                    id: "weibo-oioweb-" + index + "-" + Date.now(),
                    title: item.title,
                    url: item.url,
                    source: "微博热搜",
                    rank: index + 1,
                    views: item.hot || 0,
                    titleOriginal: item.title
                }));
            }
        } catch (error) {
            console.warn('oioweb API failed:', error);
        }

        // 方案3: 使用alapi
        try {
            const response = await fetch('https://v2.alapi.cn/api/new/wbhot?token=free');
            const data = await response.json();

            console.log('Weibo alapi response:', data);

            if (data.code === 200 && data.data && Array.isArray(data.data)) {
                return data.data.slice(0, 10).map((item, index) => ({
                    id: "weibo-alapi-" + index + "-" + Date.now(),
                    title: item.hot_word || item.title,
                    url: item.url || "https://s.weibo.com/weibo?q=" + encodeURIComponent(item.hot_word || item.title),
                    source: "微博热搜",
                    rank: index + 1,
                    views: item.hot_value || 0,
                    titleOriginal: item.hot_word || item.title
                }));
            }
        } catch (error) {
            console.warn('alapi failed:', error);
        }

        console.error('All Weibo sources failed');
        return this.getFallbackData();
    },

    getFallbackData() {
        // 返回占位数据
        return [
            {
                id: "weibo-fallback-" + Date.now(),
                title: "微博热搜数据加载中...",
                url: "https://weibo.com",
                source: "微博热搜",
                rank: 1,
                views: 0,
                titleOriginal: "微博热搜数据加载中..."
            }
        ];
    }
};
