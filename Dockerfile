# 使用官方 Node.js 運行時作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝必要的依賴（排除 Prisma 相關）
RUN npm install --omit=dev express cors dotenv moment uuid

# 複製項目文件
COPY . .

# 創建上傳目錄
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3001

# 設置環境變量
ENV NODE_ENV=production
ENV PORT=3001

# 啟動應用（使用記憶體版本伺服器）
CMD ["node", "simple-server.js"]