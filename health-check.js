const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// 健康檢查路由
app.get('/health', async (req, res) => {
  try {
    // 檢查資料庫連線
    await prisma.$queryRaw`SELECT 1`;

    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };

    console.log('✅ 健康檢查通過:', healthInfo);
    res.status(200).json(healthInfo);
  } catch (error) {
    console.error('❌ 健康檢查失敗:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected'
    });
  }
});

// 詳細狀態檢查
app.get('/status', async (req, res) => {
  try {
    const dbStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables
      ORDER BY schemaname, tablename
    `;

    res.json({
      server: {
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      },
      database: {
        status: 'connected',
        tables: dbStats
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('❌ 狀態檢查失敗:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;