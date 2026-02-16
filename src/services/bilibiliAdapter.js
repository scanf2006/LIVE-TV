// B站热榜适配器
export const BilibiliAdapter = {
    async fetchHotSearch() {
        try {
            const response = await fetch('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all');
            const data = await response.json();

            if (data.code === 0 && data.data && data.data.list) {
                const hotSearchList = data.data.list;
                const top10 = hotSearchList.slice(0, 10);

                return top10.map((item, index) => ({
                    id: `bilibili-${item.bvid || item.aid}-${Date.now()}`,
                    title: item.title,
                    url: item.short_link_v2 || `https://www.bilibili.com/video/${item.bvid}`,
                    source: 'B站热榜',
                    rank: index + 1,
                    views: item.stat?.view || 0,
                    thumbnail: item.pic
                }));
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch Bilibili hot search:', error);
            return [];
        }
    }
};
