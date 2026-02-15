// 测试vvhan.com热榜聚合API
async function testVVHanAPI() {
    console.log('Testing vvhan.com hot list API...\n');

    // 测试小红书热榜
    try {
        const url = 'https://api.vvhan.com/api/hotlist/xiaohongshu';

        console.log('Fetching from:', url);
        const response = await fetch(url);

        console.log('Status:', response.status);

        const data = await response.json();
        console.log('\nResponse structure:', Object.keys(data));
        console.log('Full response:', JSON.stringify(data, null, 2).substring(0, 500));

        if (data.success && data.data) {
            console.log('\n✅ API Success!');
            console.log('Total items:', data.data.length);
            console.log('\nFirst 5 items:');
            data.data.slice(0, 5).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title} - ${item.hot || 'N/A'}`);
            });
        } else {
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testVVHanAPI();
