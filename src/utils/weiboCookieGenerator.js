
/**
 * 自动获取微博访客 Cookie (SUB)
 * 模拟新浪访客系统流程: genvisitor -> incarnate -> SUB
 */
export async function getWeiboGuestCookie() {
    try {
        console.log('[WeiboCookie] Starting guest cookie generation...');

        // 1. 构造指纹 (Fingerprint)
        // 尽量模拟真实的浏览器环境
        const fp = {
            os: "1",
            browser: "Chrome70",
            fonts: "undefined",
            screenInfo: "1920*1080*24",
            plugins: ""
        };

        // 2. 第一步: genvisitor (获取 TID)
        const genUrl = 'https://passport.weibo.com/visitor/genvisitor';
        const formData = new URLSearchParams();
        formData.append('cb', 'gen_callback');
        formData.append('fp', JSON.stringify(fp));

        const genRes = await fetch(genUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: formData
        });

        if (!genRes.ok) {
            throw new Error(`GenVisitor request failed: ${genRes.status}`);
        }

        const genText = await genRes.text();
        // 解析 JSONP: window.gen_callback && gen_callback({...});
        const jsonpMatch = genText.match(/gen_callback\((.*)\)/);
        if (!jsonpMatch) {
            throw new Error('Failed to parse gen_callback response');
        }

        const genData = JSON.parse(jsonpMatch[1]);
        if (genData.retcode !== 20000000) {
            throw new Error(`GenVisitor logic failed: ${JSON.stringify(genData)}`);
        }

        const tid = genData.data.tid;
        const confidence = genData.data.confidence || 100;

        if (!tid) {
            throw new Error('TID not found in GenVisitor response');
        }

        // 3. 第二步: incarnate (TID 换 SUB)
        // 注意: _rand 参数是为了避免缓存
        const incarnateUrl = `https://passport.weibo.com/visitor/visitor?a=incarnate&t=${encodeURIComponent(tid)}&w=${genData.data.where || 2}&c=${confidence}&gc=&cb=cross_domain&from=weibo&_rand=${Math.random()}`;

        const incRes = await fetch(incarnateUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Referer 非常重要
                'Referer': 'https://passport.weibo.com/visitor/visitor'
            }
        });

        if (!incRes.ok) {
            throw new Error(`Incarnate request failed: ${incRes.status}`);
        }

        const incText = await incRes.text();
        // 解析 JSONP: window.cross_domain && cross_domain({...});
        const incMatch = incText.match(/cross_domain\((.*)\)/);
        if (!incMatch) {
            throw new Error('Failed to parse cross_domain response');
        }

        const incData = JSON.parse(incMatch[1]);
        if (incData.retcode !== 20000000) {
            throw new Error(`Incarnate logic failed: ${JSON.stringify(incData)}`);
        }

        const sub = incData.data.sub;

        if (sub) {
            console.log('[WeiboCookie] Successfully generated SUB cookie.');
            return sub;
        } else {
            throw new Error('SUB cookie not found in Incarnate response');
        }

    } catch (error) {
        console.error('[WeiboCookie] Error generating cookie:', error);
        return null; // 返回 null 表示失败，调用方应处理降级逻辑
    }
}
