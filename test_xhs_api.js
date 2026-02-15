// 测试顺为数据小红书API
async function testXiaohongshuAPI() {
    console.log('Testing Xiaohongshu API from Shunwei Data...');
    try {
        const url = 'https://api.itapi.cn/api/hotnews/xiaohongshu';

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers));

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.code === 200 && data.data) {
            console.log('\n✅ API Success!');
            console.log('Total items:', data.data.length);
            console.log('\nFirst 5 items:');
            data.data.slice(0, 5).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title || item.name} - ${item.hot || item.heat || 'N/A'}`);
            });
        } else {
            console.log('❌ API returned unexpected format');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testXiaohongshuAPI();
