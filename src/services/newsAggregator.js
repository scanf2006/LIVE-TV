import { RSSAdapter } from './rssAdapter';
import { RedditAdapter } from './redditAdapter';
import { TwitterAdapter } from './twitterAdapter';
import { WeiboAdapter } from './weiboAdapter';
import { YouTubeAdapter } from './youtubeAdapter';

const TRANSLATION_MAX_ITEMS = 60;
const TRANSLATION_CONCURRENCY = 5;
const TRANSLATION_TIMEOUT_MS = 4000;

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), timeoutMs))
    ]);
}

async function runWithConcurrency(items, limit, worker) {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length > 0) {
            const item = queue.shift();
            if (!item) break;
            await worker(item);
        }
    });

    await Promise.allSettled(workers);
}

export const NewsAggregator = {
    async fetchAllNews() {
        try {
            const [rssNews, redditNews, twitterNews, weiboNews, youtubeNews] = await Promise.allSettled([
                RSSAdapter.fetchAll(),
                RedditAdapter.fetchTrending(),
                TwitterAdapter.fetchTrending(),
                WeiboAdapter.fetchHotSearch(),
                YouTubeAdapter.fetchTrending()
            ]);

            let allNews = [];

            if (rssNews.status === 'fulfilled') allNews = allNews.concat(rssNews.value);
            if (redditNews.status === 'fulfilled') allNews = allNews.concat(redditNews.value);
            if (twitterNews.status === 'fulfilled') allNews = allNews.concat(twitterNews.value);
            if (weiboNews.status === 'fulfilled') allNews = allNews.concat(weiboNews.value);
            if (youtubeNews.status === 'fulfilled') allNews = allNews.concat(youtubeNews.value);

            // Default to original title to avoid empty UI text if translation fails/skips.
            allNews.forEach((item) => {
                if (!item.titleTranslated) {
                    item.titleTranslated = item.titleOriginal;
                }
            });

            try {
                const { translate } = require('google-translate-api-x');

                const translatable = allNews
                    .filter((item) => item?.titleOriginal && item.source !== '微博热搜')
                    .slice(0, TRANSLATION_MAX_ITEMS);

                await runWithConcurrency(translatable, TRANSLATION_CONCURRENCY, async (item) => {
                    try {
                        const res = await withTimeout(
                            translate(item.titleOriginal, { to: 'zh-CN' }),
                            TRANSLATION_TIMEOUT_MS
                        );
                        item.titleTranslated = res.text || item.titleOriginal;
                    } catch {
                        item.titleTranslated = item.titleOriginal;
                    }
                });
            } catch (error) {
                console.error('Translation service error:', error);
            }

            allNews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return allNews;
        } catch (error) {
            console.error('NewsAggregator Error:', error);
            return [];
        }
    }
};
