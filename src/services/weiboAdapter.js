// Weibo Hot Search Adapter
export const WeiboAdapter = {
    async fetchHotSearch() {
        try {
            const response = await fetch('https://weibo.com/ajax/side/hotSearch');
            const data = await response.json();

            if (data.ok === 1 && data.data && data.data.realtime) {
                const hotSearchList = data.data.realtime;
                const top10 = hotSearchList.slice(0, 10);

                return top10.map((item, index) => ({
                    id: weibo--,
                    title: item.word,
                    url: https://s.weibo.com/weibo?q=,
                    source: 'Weibo Hot',
                    rank: index + 1,
                    views: item.num || 0
                }));
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch Weibo hot search:', error);
            return [];
        }
    }
};
