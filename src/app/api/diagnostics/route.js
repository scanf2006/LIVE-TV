import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        youtubeApiKey: {
            exists: !!process.env.YOUTUBE_API_KEY,
            length: process.env.YOUTUBE_API_KEY?.length || 0,
            preview: process.env.YOUTUBE_API_KEY ?
                `${process.env.YOUTUBE_API_KEY.substring(0, 4)}...${process.env.YOUTUBE_API_KEY.substring(process.env.YOUTUBE_API_KEY.length - 4)}` :
                'NOT FOUND'
        },
        allEnvKeys: Object.keys(process.env).filter(key =>
            key.includes('YOUTUBE') || key.includes('API')
        )
    };

    return NextResponse.json(diagnostics);
}
