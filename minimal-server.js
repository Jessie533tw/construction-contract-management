const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 記錄所有請求
app.use((req, res, next) => {
    console.log(`📥 收到請求: ${req.method} ${req.url} from ${req.ip}`);
    console.log(`📋 Headers:`, req.headers);
    next();
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('❌ 應用錯誤:', err);
    res.status(500).json({
        error: '伺服器內部錯誤',
        message: process.env.NODE_ENV === 'production' ? '請稍後再試' : err.message
    });
});

// 最基本的路由
app.get('/', (req, res) => {
    res.send(`
    <html>
        <head>
            <title>建設發包管理系統 - 極簡版本</title>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 40px; background: #f0f8ff;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #2c3e50;">🏗️ 建設發包管理系統</h1>
                <h2 style="color: #e74c3c;">✅ 極簡測試版本 - 版本 ${Date.now()}</h2>
                <p><strong>📊 端口:</strong> ${PORT}</p>
                <p><strong>🕐 時間:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>🔍 Node 版本:</strong> ${process.version}</p>
                <p><strong>🌐 主機名:</strong> ${require('os').hostname()}</p>
                <hr>
                <p style="color: #27ae60; font-size: 18px;"><strong>如果您看到這個頁面，表示我們的伺服器正在正常運行！</strong></p>
                <a href="/health" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🔍 健康檢查</a>
            </div>
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

// 404 處理
app.use('*', (req, res) => {
    console.log(`⚠️  404 - 未找到路由: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: '頁面未找到',
        path: req.originalUrl
    });
});

// 啟動伺服器，監聽所有介面
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 極簡伺服器啟動成功！`);
    console.log(`📊 端口: ${PORT}`);
    console.log(`🌐 監聽: 0.0.0.0:${PORT}`);
    console.log(`✅ 狀態: 運行中`);
}).on('error', (err) => {
    console.error('❌ 伺服器啟動失敗:', err);
    process.exit(1);
});

module.exports = app;