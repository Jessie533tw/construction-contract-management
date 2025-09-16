# 使用官方 Node.js 運行時作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝項目依賴
RUN npm ci --only=production

# 複製項目文件
COPY . .

# 生成 Prisma 客戶端
RUN npx prisma generate

# 創建上傳目錄
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3001

# 啟動應用
CMD ["npm", "start"]