#!/bin/bash

# Zeabur 啟動腳本
echo "🚀 開始部署建設發包管理系統..."

# 檢查環境變數
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 錯誤: DATABASE_URL 環境變數未設置"
    exit 1
fi

echo "✅ 環境變數檢查完成"

# 生成 Prisma 客戶端
echo "📦 生成 Prisma 客戶端..."
npx prisma generate

# 執行資料庫遷移
echo "🗄️  執行資料庫遷移..."
npx prisma migrate deploy

# 檢查資料庫連線
echo "🔗 檢查資料庫連線..."
npx prisma db push --accept-data-loss

echo "✅ 部署準備完成，啟動應用程式..."

# 啟動應用
npm start