// 查看完整API响应结构
async function inspectAPIResponse() {
    const apiKey = 'zFaBZRobN38IyUqOFmgolfWMRS';
    const url = `https://api.itapi.cn/api/hotnews/xiaohongshu?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('Full API Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.data && data.data[0]) {
            console.log('\n\nFirst item structure:');
            console.log('Keys:', Object.keys(data.data[0]));
            console.log('Sample:', data.data[0]);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

inspectAPIResponse();
