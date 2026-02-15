// 测试顺为数据API密钥
async function testAPIKey() {
    const apiKey = 'zFaBZRobN38IyUqOFmgolfWMRS';
    const url = `https://api.itapi.cn/api/hotnews/xiaohongshu?key=${apiKey}`;

    console.log('Testing Shunwei Data API with provided key...\n');
    console.log('URL:', url.replace(apiKey, 'YOUR_KEY'));

    try {
        const response = await fetch(url);
        console.log('Status:', response.status);

        const data = await response.json();
        console.log('\nResponse code:', data.code);
        console.log('Message:', data.msg);

        if (data.code === 200 && data.data) {
            console.log('\n✅ API Key is VALID!');
            console.log('Total items:', data.data.length);
            console.log('\nFirst 5 items:');
            data.data.slice(0, 5).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title} - 热度: ${item.hot || 'N/A'}`);
            });
        } else {
            console.log('\n❌ API returned error');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testAPIKey();
