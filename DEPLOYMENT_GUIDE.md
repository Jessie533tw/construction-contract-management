# Zeabur 部署指南

## 🚀 快速部署步驟

### 1. 準備 GitHub 儲存庫
```bash
# 推送代碼到 GitHub
git add .
git commit -m "Add Zeabur deployment configuration"
git push origin main
```

### 2. 登入 Zeabur 平台
- 前往 [Zeabur](https://zeabur.com)
- 使用 GitHub 帳號登入

### 3. 創建新專案
- 點擊 "New Project"
- 選擇 "Import from GitHub"
- 選擇 `construction-contract-management` 儲存庫

### 4. 設置 PostgreSQL 資料庫
- 在專案中點擊 "Add Service"
- 選擇 "PostgreSQL"
- 等待資料庫部署完成

### 5. 配置環境變數
在 Zeabur 控制台設置以下環境變數：

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://[從 PostgreSQL 服務複製]
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters
COMPANY_NAME=你的建設公司名稱
COMPANY_EMAIL=company@example.com
SYSTEM_URL=https://your-app.zeabur.app
```

**SMTP 設定 (可選):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 6. 部署應用程式
- 應用程式會自動開始部署
- 等待部署完成（約 3-5 分鐘）

### 7. 驗證部署
部署完成後，訪問以下 URL 進行驗證：

- **主應用**: `https://your-app.zeabur.app`
- **健康檢查**: `https://your-app.zeabur.app/health`
- **狀態檢查**: `https://your-app.zeabur.app/status`

## 🔍 部署後檢查清單

### ✅ 基本功能檢查
- [ ] 應用程式正常啟動
- [ ] 資料庫連線成功
- [ ] 健康檢查端點回應正常
- [ ] 用戶登入功能正常

### ✅ 預設帳號
部署完成後，可使用以下預設帳號登入：

**管理員帳號:**
- 信箱: `admin@construction.com`
- 密碼: `admin123`

**專案經理帳號:**
- 信箱: `manager@construction.com`
- 密碼: `manager123`

## 🐛 問題排除

### 常見問題

1. **資料庫連線失敗**
   - 檢查 `DATABASE_URL` 環境變數是否正確
   - 確認 PostgreSQL 服務已啟動

2. **應用程式啟動失敗**
   - 檢查部署日誌
   - 確認所有必要的環境變數已設置

3. **Prisma 相關錯誤**
   - 檢查是否執行了資料庫遷移
   - 在 Zeabur 控制台執行: `npx prisma db push`

### 查看日誌
在 Zeabur 控制台中：
1. 進入你的專案
2. 點擊應用程式服務
3. 切換到 "Logs" 頁籤

### 執行資料庫命令
如果需要手動執行資料庫相關命令：

```bash
# 生成 Prisma 客戶端
npx prisma generate

# 推送資料庫結構
npx prisma db push

# 執行種子數據
npx prisma db seed
```

## 📊 監控和維護

### 健康檢查
定期檢查以下端點：
- `GET /health` - 基本健康狀態
- `GET /status` - 詳細系統狀態

### 效能監控
- 監控應用程式記憶體使用量
- 檢查資料庫連線數量
- 關注回應時間

### 備份建議
- 定期備份 PostgreSQL 資料庫
- 保存重要的環境變數配置

## 🔄 更新部署

當需要更新應用程式時：

1. 推送新代碼到 GitHub
2. Zeabur 會自動觸發重新部署
3. 等待部署完成
4. 驗證新功能是否正常運作

## 📞 技術支援

如遇到問題，可以：
1. 檢查 Zeabur 部署日誌
2. 參考本指南的問題排除章節
3. 聯繫技術支援團隊