# 使用官方 Node.js 運行時作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製所有文件
COPY . .

# 安裝依賴
RUN npm install --production

# 創建上傳目錄
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3001

# 啟動應用
CMD ["npm", "start"]