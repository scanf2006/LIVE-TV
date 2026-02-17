// 微博热搜适配器 - 使用静态数据作为后备

// 独立的后备数据函数,避免this上下文问题
function getFallbackData() {
    const fallbackTopics = [
        '春节档电影票房创新高',
        '多地气温回升迎来春天',
        '科技公司发布新产品',
        '体育赛事精彩瞬间',
        '明星动态引发热议',
        '社会热点事件关注',
        '经济数据发布',
        '文化活动精彩纷呈',
        '教育改革新政策',
        '健康生活小贴士'
    ];

    return fallbackTopics.map((topic, index) => ({
        id: `weibo-fallback-${index}-${Date.now()}`,
        title: topic,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(topic)}`,
        source: '微博热搜',
        rank: index + 1,
        views: 0,
        titleOriginal: topic
    }));
}

export const WeiboAdapter = {
    async fetchHotSearch() {
        // 尝试多个API源
        const sources = [
            {
                name: 'vvhan',
                url: 'https://api.vvhan.com/api/hotlist/weiboHot',
                parser: (data) => {
                    if (data.success && data.data) {
                        return data.data.slice(0, 10).map((item, index) => ({
                            id: `weibo-vvhan-${index}-${Date.now()}`,
                            title: item.title,
                            url: item.url,
                            source: '微博热搜',
                            rank: index + 1,
                            views: item.hot || 0,
                            titleOriginal: item.title
                        }));
                    }
                    return null;
                }
            },
            {
                name: 'oioweb',
                url: 'https://api.oioweb.cn/api/common/HotList?type=weibo',
                parser: (data) => {
                    if (data.code === 200 && data.result && data.result.list) {
                        return data.result.list.slice(0, 10).map((item, index) => ({
                            id: `weibo-oioweb-${index}-${Date.now()}`,
                            title: item.title,
                            url: item.url,
                            source: '微博热搜',
                            rank: index + 1,
                            views: item.hot || 0,
                            titleOriginal: item.title
                        }));
                    }
                    return null;
                }
            }
        ];

        // 尝试每个数据源
        for (const source of sources) {
            try {
                console.log(`Trying Weibo source: ${source.name}`);
                const response = await fetch(source.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    // 添加超时
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    const data = await response.json();
                    const parsed = source.parser(data);
                    if (parsed && parsed.length > 0) {
                        console.log(`Weibo ${source.name} success:`, parsed.length, 'items');
                        return parsed;
                    }
                }
            } catch (error) {
                console.warn(`Weibo ${source.name} failed:`, error.message);
                continue;
            }
        }

        console.log('All Weibo sources failed, using fallback data');
        return getFallbackData(); // 直接调用独立函数
    }
};
