import { NextResponse } from 'next/server';
import { IPTVAdapter } from '@/services/iptvAdapter';

// 内存缓存
let cachedChannels = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 1; // 临时缩短为 1 分钟，方便调试预览

export async function GET() {
    console.log('>>> [API IPTV] Fetching real channels...');
    try {
        const now = Date.now();

        // 如果缓存有效，直接返回
        if (cachedChannels && (now - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json({
                success: true,
                data: cachedChannels,
                cached: true,
                timestamp: lastFetchTime
            });
        }

        // 获取并验证频道 (保持优化后的 20 个上限)
        const channels = await IPTVAdapter.getVerifiedChannels();

        // 更新缓存
        cachedChannels = channels;
        lastFetchTime = now;

        return NextResponse.json({
            success: true,
            data: channels,
            cached: false,
            timestamp: now
        });
    } catch (error) {
        console.error('[API IPTV] Error:', error);
        return NextResponse.json({
            success: false,
            message: '获取频道列表失败',
            error: error.message
        }, { status: 500 });
    }
}
