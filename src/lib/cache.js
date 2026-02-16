// API缓存工具类
// 使用localStorage实现客户端缓存

const CACHE_DURATION = 10 * 60 * 1000; // 10分钟
const CACHE_PREFIX = 'api_cache_';

export class APICache {
    /**
     * 获取缓存数据
     * @param {string} key - 缓存键名
     * @returns {any|null} - 缓存的数据或null
     */
    static get(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const cached = localStorage.getItem(cacheKey);

            if (!cached) {
                return null;
            }

            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;

            // 检查是否过期
            if (age > CACHE_DURATION) {
                localStorage.removeItem(cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.error('[Cache] Error reading cache:', error);
            return null;
        }
    }

    /**
     * 设置缓存数据
     * @param {string} key - 缓存键名
     * @param {any} data - 要缓存的数据
     */
    static set(key, data) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('[Cache] Error writing cache:', error);
            // 如果localStorage满了,清理旧缓存
            if (error.name === 'QuotaExceededError') {
                this.clearOldCache();
                // 重试
                try {
                    const cacheKey = CACHE_PREFIX + key;
                    const cacheData = {
                        data,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                } catch (retryError) {
                    console.error('[Cache] Retry failed:', retryError);
                }
            }
        }
    }

    /**
     * 清除指定缓存
     * @param {string} key - 缓存键名
     */
    static remove(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            localStorage.removeItem(cacheKey);
        } catch (error) {
            console.error('[Cache] Error removing cache:', error);
        }
    }

    /**
     * 清除所有API缓存
     */
    static clear() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(CACHE_PREFIX))
                .forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('[Cache] Error clearing cache:', error);
        }
    }

    /**
     * 清理过期缓存
     */
    static clearOldCache() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(CACHE_PREFIX))
                .forEach(key => {
                    try {
                        const cached = localStorage.getItem(key);
                        if (cached) {
                            const { timestamp } = JSON.parse(cached);
                            const age = Date.now() - timestamp;
                            if (age > CACHE_DURATION) {
                                localStorage.removeItem(key);
                            }
                        }
                    } catch (error) {
                        // 如果解析失败,删除该缓存
                        localStorage.removeItem(key);
                    }
                });
        } catch (error) {
            console.error('[Cache] Error clearing old cache:', error);
        }
    }

    /**
     * 获取缓存信息
     * @param {string} key - 缓存键名
     * @returns {object|null} - 缓存信息(包含年龄)
     */
    static getInfo(key) {
        try {
            const cacheKey = CACHE_PREFIX + key;
            const cached = localStorage.getItem(cacheKey);

            if (!cached) {
                return null;
            }

            const { timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            const remaining = CACHE_DURATION - age;

            return {
                age,
                remaining: remaining > 0 ? remaining : 0,
                expired: age > CACHE_DURATION,
                timestamp
            };
        } catch (error) {
            console.error('[Cache] Error getting cache info:', error);
            return null;
        }
    }
}
