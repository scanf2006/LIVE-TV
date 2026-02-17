import { getWeiboGuestCookie } from '../utils/weiboCookieGenerator.js';

// 微博热搜适配器 - 全面修复版 (Multi-Source + Detailed Logging)
export const WeiboAdapter = {
    async fetchHotSearch() {
        console.log('--- WeiboAdapter.fetchHotSearch START ---');

        try {
            // 定义所有可能的数据源,按优先级排序
            const sources = [
                {
                    // 0. Weibo Direct (With Auto-Cookie) - 官方接口+模拟访客
                    name: 'weibo-direct',
                    url: 'https://weibo.com/ajax/side/hotSearch',
                    parser: (data) => {
                        if (data && data.data && data.data.realtime) {
                            return data.data.realtime.slice(0, 10).map((item, index) => ({
                                id: `weibo-direct-${index}-${Date.now()}`,
                                title: item.note || item.word,
                                url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word_scheme || item.word)}`,
                                source: '微博热搜',
                                rank: index + 1,
                                views: item.num,
                                titleOriginal: item.note || item.word,
                                timestamp: new Date().toISOString()
                            }));
                        }
                        return null;
                    },
                    needsCookie: true // 标记该源需要 Cookie 处理
                },
                {
                    // 1. GitHub Raw (Master分支) - 最直接
                    name: 'github-raw-master',
                    url: 'https://raw.githubusercontent.com/justjavac/weibo-trending-hot-search/master/hot-search.json',
                    parser: (data) => parseGithubData(data, 'github-raw-master')
                },
                {
                    // 2. jsDelivr CDN - 快速且稳定
                    name: 'jsdelivr',
                    url: 'https://cdn.jsdelivr.net/gh/justjavac/weibo-trending-hot-search@master/hot-search.json',
                    parser: (data) => parseGithubData(data, 'jsdelivr')
                },
                {
                    // 3. Fastly jsDelivr (备用CDN域名)
                    name: 'jsdelivr-fastly',
                    url: 'https://fastly.jsdelivr.net/gh/justjavac/weibo-trending-hot-search@master/hot-search.json',
                    parser: (data) => parseGithubData(data, 'jsdelivr-fastly')
                },
                {
                    // 4. Tenapi (专为国内优化的API)
                    name: 'tenapi',
                    url: 'https://tenapi.cn/v2/weibohot',
                    parser: (data) => {
                        if (data.code === 200 && data.data) {
                            return data.data.slice(0, 10).map((item, index) => ({
                                id: `weibo-tenapi-${index}-${Date.now()}`,
                                title: item.name,
                                url: item.url,
                                source: '微博热搜',
                                rank: index + 1,
                                views: parseViews(item.hot),
                                titleOriginal: item.name,
                                timestamp: new Date().toISOString()
                            }));
                        }
                        return null;
                    }
                },
                {
                    // 5. VVhan API
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
                                views: parseViews(item.hot),
                                titleOriginal: item.title,
                                timestamp: new Date().toISOString()
                            }));
                        }
                        return null;
                    }
                },
                {
                    // 6. OIOWeb API
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
                                views: parseViews(item.hot),
                                titleOriginal: item.title,
                                timestamp: new Date().toISOString()
                            }));
                        }
                        return null;
                    }
                }
            ];

            // 尝试每个数据源
            for (const source of sources) {
                try {
                    console.log(`Trying Weibo source: ${source.name} (${source.url})`);

                    const controller = new AbortController();
                    // 这里的超时时间要足够短以快速失败,但也要足够长以允许连接
                    // 这里的超时时间要足够短以快速失败,但也要足够长以允许连接
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    // 准备请求头
                    const headers = {
                        // 模拟浏览器UA,防止被GitHub/CDN拦截
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Cache-Control': 'no-cache',
                        'Referer': 'https://weibo.com/',
                        'X-Requested-With': 'XMLHttpRequest'
                    };

                    // 处理需要 Cookie 的源
                    if (source.needsCookie) {
                        try {
                            const subCookie = await getWeiboGuestCookie();
                            if (subCookie) {
                                headers['Cookie'] = `SUB=${subCookie}`;
                                console.log(`[WeiboAdapter] Using generated cookie for source: ${source.name}`);
                            } else {
                                console.warn(`[WeiboAdapter] Failed to generate cookie for ${source.name}, skipping`);
                                continue;
                            }
                        } catch (cookieErr) {
                            console.error(`[WeiboAdapter] Cookie generation error: ${cookieErr}`);
                            continue;
                        }
                    }

                    const response = await fetch(source.url, {
                        headers: headers,
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const contentType = response.headers.get('content-type');
                        // 简单的内容类型检查
                        if (contentType && contentType.includes('text/html')) {
                            console.warn(`Weibo ${source.name} returned HTML (likely 404 page or captcha)`);
                            continue;
                        }

                        const data = await response.json();
                        const parsed = source.parser(data);

                        if (parsed && parsed.length > 0) {
                            console.log(`Weibo ${source.name} success:`, parsed.length, 'items');
                            return parsed;
                        } else {
                            console.warn(`Weibo ${source.name} parsed empty data`);
                        }
                    } else {
                        console.warn(`Weibo ${source.name} returned status: ${response.status}`);
                    }
                } catch (error) {
                    // 记录具体错误,如果是Timeout则明确说明
                    const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError';
                    console.warn(`Weibo ${source.name} failed: ${isTimeout ? 'TIMEOUT' : error.message}`);
                    continue;
                }
            }
        } catch (e) {
            console.error('Critical error in Weibo loop:', e);
        }

        console.log('All Weibo sources failed, generating fallback data now');

        // 最后的防线: 模拟数据
        return getFallbackData();
    }
};

// 辅助函数: 解析GitHub数据格式
function parseGithubData(data, sourceName) {
    if (Array.isArray(data)) {
        return data.slice(0, 10).map((item, index) => ({
            id: `weibo-${sourceName}-${index}-${Date.now()}`,
            title: item.title || item.word,
            url: item.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(item.title || item.word)}`,
            source: '微博热搜',
            rank: index + 1,
            views: item.hot || item.num || 0,
            titleOriginal: item.title || item.word,
            timestamp: new Date().toISOString()
        }));
    }
    return null;
}

// 辅助函数: 处理热度数值
function parseViews(hot) {
    if (!hot) return 0;
    if (typeof hot === 'number') return hot;
    return parseInt(hot) || 0;
}

// 辅助函数: 获取模拟数据
function getFallbackData() {
    return [
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
    ].map((topic, index) => ({
        id: `weibo-fallback-${index}-${Date.now()}`,
        title: topic,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(topic)}`,
        source: '微博热搜',
        rank: index + 1,
        views: 0,
        titleOriginal: topic,
        timestamp: new Date().toISOString()
    }));
}
