import { NextResponse } from 'next/server';
import { NewsAggregator } from '@/services/newsAggregator';

export const dynamic = 'force-dynamic'; // Prevent caching so we get fresh news

export async function GET() {
    try {
        const news = await NewsAggregator.fetchAllNews();
        return NextResponse.json({ success: true, count: news.length, data: news });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
