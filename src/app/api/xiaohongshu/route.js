// API路由 - 获取小红书热榜数据
import { XiaohongshuAdapter } from '@/services/xiaohongshuAdapter';

export async function GET(request) {
    try {
        const data = await XiaohongshuAdapter.fetchHotTopics();
        return Response.json(data);
    } catch (error) {
        console.error('Xiaohongshu API route error:', error);
        return Response.json([], { status: 500 });
    }
}
