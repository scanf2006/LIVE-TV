import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // 禁用缓存

export async function GET() {
    const results = [];

    const sources = [
        {
            name: 'github-raw-master',
            url: 'https://raw.githubusercontent.com/justjavac/weibo-trending-hot-search/master/hot-search.json',
        },
        {
            name: 'jsdelivr',
            url: 'https://cdn.jsdelivr.net/gh/justjavac/weibo-trending-hot-search@master/hot-search.json',
        },
        {
            name: 'tenapi',
            url: 'https://tenapi.cn/v2/weibohot',
        },
        {
            name: 'vvhan',
            url: 'https://api.vvhan.com/api/hotlist/weiboHot',
        }
    ];

    for (const source of sources) {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(source.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const duration = Date.now() - start;

            let data = null;
            let error = null;

            if (response.ok) {
                try {
                    const json = await response.json();
                    data = Array.isArray(json) ? `Array(${json.length})` : 'Object';
                } catch (e) {
                    error = 'JSON Parse Error: ' + e.message;
                }
            } else {
                error = `HTTP Error: ${response.status} ${response.statusText}`;
            }

            results.push({
                source: source.name,
                url: source.url,
                status: response.ok ? 'OK' : 'Failed',
                duration: `${duration}ms`,
                dataSummary: data,
                error: error
            });

        } catch (e) {
            results.push({
                source: source.name,
                url: source.url,
                status: 'Error',
                duration: `${Date.now() - start}ms`,
                error: e.message
            });
        }
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        results
    });
}
