// 诊断脚本 - 检查环境变量是否正确加载
export default async function handler(req, res) {
    const apiKey = process.env.XIAOHONGSHU_API_KEY;
    
    // 安全检查 - 只显示密钥的前4位和后4位
    const maskedKey = apiKey 
        ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
        : 'NOT SET';
    
    // 测试API调用
    let apiStatus = 'NOT TESTED';
    let apiData = null;
    
    if (apiKey) {
        try {
            const url = `https://api.itapi.cn/api/hotnews/xiaohongshu?key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            apiStatus = data.code === 200 ? 'SUCCESS' : `FAILED (code: ${data.code})`;
            apiData = {
                code: data.code,
                msg: data.msg,
                itemCount: data.data ? data.data.length : 0,
                firstItem: data.data && data.data[0] ? data.data[0].name : null
            };
        } catch (error) {
            apiStatus = `ERROR: ${error.message}`;
        }
    }
    
    res.status(200).json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        apiKeyConfigured: !!apiKey,
        apiKeyMasked: maskedKey,
        apiStatus: apiStatus,
        apiData: apiData
    });
}
