// 新闻聚合器 - 整合所有新闻源
import * as Sentry from "@sentry/nextjs";
import { RSSAdapter } from './rssAdapter';
import { RedditAdapter } from './redditAdapter';
import { TwitterAdapter } from './twitterAdapter';
import { WeiboAdapter } from './weiboAdapter';
import { ZhihuAdapter } from './zhihuAdapter';
import { BilibiliAdapter } from './bilibiliAdapter';
import { YouTubeAdapter } from './youtubeAdapter';
import { translateText } from './translationService';

export const NewsAggregator = {
    async fetchAllNews() {
        try {
            const [rssNews, redditNews, twitterNews, weiboNews, zhihuNews, youtubeNews] = await Promise.allSettled([
                RSSAdapter.fetchAll(),
                RedditAdapter.fetchTrending(),
                TwitterAdapter.fetchTrending(),
                WeiboAdapter.fetchHotSearch(),
                ZhihuAdapter.fetchHotTopics(),
                YouTubeAdapter.fetchTrending()
            ]);

            let allNews = [];

            if (rssNews.status === 'fulfilled') allNews = allNews.concat(rssNews.value);
            if (redditNews.status === 'fulfilled') allNews = allNews.concat(redditNews.value);
            if (twitterNews.status === 'fulfilled') allNews = allNews.concat(twitterNews.value);
            if (weiboNews.status === 'fulfilled') allNews = allNews.concat(weiboNews.value);
            if (zhihuNews.status === 'fulfilled') allNews = allNews.concat(zhihuNews.value);
            if (youtubeNews.status === 'fulfilled') allNews = allNews.concat(youtubeNews.value);

            console.log('[NewsAggregator] Total news count after concat:', allNews.length);

            // Translation Step
            try {
                const { translate } = require('google-translate-api-x');

                // 翻译所有新闻,不限制数量
                await Promise.allSettled(allNews.map(async (item) => {
                    if (!item.titleOriginal) return;
                    // 微博和知乎内容已是中文,跳过翻译
                    if (item.source === 'Weibo' || item.source === 'Zhihu') {
                        item.titleTranslated = item.titleOriginal;
                        return;
                    }
                    try {
                        const res = await translate(item.titleOriginal, { to: 'zh-CN' });
                        item.titleTranslated = res.text;
                    } catch (e) {
                        // keep original if translation fails
                        console.error('Translation failed for item:', item.id, e.message);
                        item.titleTranslated = item.titleOriginal; // 翻译失败时使用原文
                    }
                }));

                // 不要替换allNews,保留所有新闻数据
                // allNews = newsToTranslate; // 这行代码会丢弃未翻译的新闻!
            } catch (e) {
                console.error('Translation service error:', e);
            }

            // Sort by timestamp if available, otherwise randomize or keeping source order
            // Ideally mix them up a bit so it's not just blocks of same source

            allNews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return allNews;
        } catch (error) {
            console.error('NewsAggregator Error:', error);
            return [];
        }
    }
};
