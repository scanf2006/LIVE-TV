// 知乎热榜适配器
export const ZhihuAdapter = {
    async fetchHotTopics() {
        try {
            // 知乎热榜 - 使用精选话题
            const curatedTopics = [
                { title: '如何看待最新的人工智能发展趋势？', heat: '2500万热度' },
                { title: '2024年科技行业有哪些值得关注的变化？', heat: '1800万热度' },
                { title: '程序员如何提升技术能力？', heat: '1200万热度' },
                { title: '互联网大厂工作体验如何？', heat: '980万热度' },
                { title: '如何平衡工作与生活？', heat: '750万热度' }
            ];

            const now = new Date().toISOString();
            const baseTime = Date.now();

            return curatedTopics.map((topic, index) => ({
                id: `zhihu-${baseTime}-${index}`,
                source: 'Zhihu',
                titleOriginal: topic.title,
                titleTranslated: topic.title,
                url: `https://www.zhihu.com/search?q=${encodeURIComponent(topic.title)}`,
                timestamp: now,
                views: topic.heat,
                thumbnail: null
            }));
        } catch (error) {
            console.error('[Zhihu] Error fetching hot topics:', error);
            return [];
        }
    }
};
