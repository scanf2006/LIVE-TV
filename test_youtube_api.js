// 测试YouTube API
const YOUTUBE_API_KEY = 'AIzaSyBj489m0z_PM7EJBNL20HAGerSN9nGJWYI'; // 替换为您的实际API密钥

async function testYouTubeAPI() {
    const regionCode = 'US';
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=10&key=${YOUTUBE_API_KEY}`;

    console.log('Testing YouTube API...');
    console.log('URL:', url.replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN'));

    try {
        const response = await fetch(url);
        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }

        const data = await response.json();
        console.log('Success! Got', data.items?.length || 0, 'videos');

        if (data.items && data.items.length > 0) {
            console.log('First video:', data.items[0].snippet.title);
        } else {
            console.log('Response data:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Exception:', error.message);
    }
}

testYouTubeAPI();
