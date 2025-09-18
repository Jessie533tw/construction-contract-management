const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// 最基本的路由
app.get('/', (req, res) => {
    res.send(`
    <html>
        <head><title>建設發包管理系統</title></head>
        <body>
            <h1>🏗️ 建設發包管理系統</h1>
            <p>✅ 伺服器運行正常</p>
            <p>📊 端口: ${PORT}</p>
            <p>🕐 時間: ${new Date().toLocaleString()}</p>
            <a href="/health">健康檢查</a>
        </body>
    </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '系統運行正常',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// 啟動伺服器，監聽所有介面
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 極簡伺服器啟動成功！`);
    console.log(`📊 端口: ${PORT}`);
    console.log(`🌐 監聽: 0.0.0.0:${PORT}`);
    console.log(`✅ 狀態: 運行中`);
});

module.exports = app;