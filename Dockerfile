# 使用官方 Node.js 運行時作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 只複製 package.json 先安裝依賴
COPY package.json ./

# 安裝依賴，跳過腳本執行
RUN npm install --production --ignore-scripts

# 複製應用程式檔案（.dockerignore 會排除 prisma 等檔案）
COPY . .

# 創建上傳目錄
RUN mkdir -p uploads

# 設置環境變數
ENV NODE_ENV=production

# 暴露端口（讓 Zeabur 自動分配）
EXPOSE 8080

# 啟動應用（使用極簡版本測試）
CMD ["node", "minimal-server.js"]