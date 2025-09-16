# 建設公司發包管理系統

一個完整的建設公司發包採購管理系統，使用 JavaScript 開發，支援詢價、比價、採購、進度追蹤等核心功能。

## 🏗️ 系統功能

### 核心流程
1. **詢價單管理** - 根據工程數量計算建立詢價單
2. **發包計價比較表** - 多家廠商報價比較分析
3. **採購單管理** - 自動生成採購單並整合 ERP 系統
4. **發包施工進度表** - 交期追蹤與現場進度管理
5. **採購明細報表** - 工程採購明細表與工料採購明細表

### 主要特色
- ✅ 完整的詢價到採購流程
- ✅ 智能化價格比較與決標建議
- ✅ 自動預算扣除與成本控管
- ✅ 即時進度追蹤與交期管理
- ✅ 多維度採購分析報表
- ✅ 供應商績效評估
- ✅ Web 介面與 API 支援

## 📁 專案結構

```
建設公司發包管理系統/
├── models/
│   └── dataModels.js          # 核心資料模型
├── services/
│   ├── inquiryService.js      # 詢價單服務
│   ├── comparisonService.js   # 比價服務
│   ├── purchaseOrderService.js # 採購單服務
│   ├── scheduleService.js     # 進度管理服務
│   └── reportService.js       # 報表服務
├── index.html                 # Web 前端介面
├── app.js                     # 前端應用程式
├── main.js                    # 主程式與演示
├── package.json               # 專案配置
└── README.md                  # 說明文件
```

## 🚀 快速開始

### 1. 安裝與執行
```bash
# 克隆專案
git clone [repository-url]
cd 作業7-發包管理(JS)

# 執行演示程式
node main.js

# 或使用 npm
npm start
```

### 2. Web 介面
```bash
# 在瀏覽器中開啟
open index.html
```

## 💻 使用範例

### 建立詢價單
```javascript
const inquiryService = new InquiryService();

// 建立詢價單
const inquiry = inquiryService.createInquiry(
    '辦公大樓專案',
    'PROJ001', 
    '2024-02-15'
);

// 新增採購項目
inquiryService.addItemToInquiry(inquiry.inquiryId, {
    itemId: 'ITEM001',
    itemName: '鋼筋混凝土',
    specification: 'C240',
    unit: 'm3',
    quantity: 100,
    estimatedUnitPrice: 3500
});

// 指定目標供應商並發送
inquiryService.addSuppliersToInquiry(inquiry.inquiryId, ['SUP001', 'SUP002']);
inquiryService.sendInquiry(inquiry.inquiryId);
```

### 處理廠商報價
```javascript
const comparisonService = new ComparisonService();

// 廠商提交報價
const quote = comparisonService.submitQuote(inquiryId, supplierId, {
    quotedDate: '2024-01-20',
    paymentTerms: '交貨後30天付款',
    items: [
        { itemId: 'ITEM001', unitPrice: 3400, totalPrice: 340000, deliveryDays: 14 }
    ]
});

// 生成比較表與分析
const comparison = comparisonService.generateDetailedComparison(inquiryId);
comparisonService.selectSupplier(inquiryId, 'SUP001', '價格合理且交期最優');
```

### 生成採購單
```javascript
const purchaseOrderService = new PurchaseOrderService();

// 設定專案預算
purchaseOrderService.setBudgetModule('辦公大樓專案', 50000000, 5000000);

// 生成採購單
const po = purchaseOrderService.generatePurchaseOrder(
    inquiryId,
    selectedSupplierId,
    selectedQuote,
    '辦公大樓專案',
    '台北市信義區工地'
);

// 確認採購單（自動扣除預算）
purchaseOrderService.confirmPurchaseOrder(po.poId);
```

### 進度追蹤管理
```javascript
const scheduleService = new ScheduleService();

// 建立施工進度表
const schedule = scheduleService.createConstructionSchedule('辦公大樓專案', 'PROJ001');

// 加入採購單到進度表
scheduleService.addPurchaseOrderToSchedule('PROJ001', purchaseOrder);

// 更新交貨狀態
scheduleService.updateDeliveryStatus('PROJ001', po.poId, '2024-02-01');

// 更新施工進度
scheduleService.updateConstructionProgress('PROJ001', po.poId, 75, '施工進度良好');
```

### 生成採購報表
```javascript
const reportService = new ReportService();

// 工程採購明細表
const engineeringReport = reportService.generateEngineeringPurchaseReport(
    '辦公大樓專案',
    purchaseOrders
);

// 工料採購明細表  
const materialReport = reportService.generateMaterialPurchaseReport(
    '辦公大樓專案', 
    purchaseOrders
);
```

## 📊 核心資料模型

### 詢價單 (Inquiry)
- 詢價單編號、專案資訊
- 採購項目清單
- 目標供應商列表
- 狀態追蹤

### 報價單 (Quote)  
- 供應商報價資訊
- 項目單價與總價
- 交期與付款條件

### 採購單 (PurchaseOrder)
- 正式採購資訊
- 預算控制整合
- 交期管理

### 施工進度表 (ConstructionSchedule)
- 專案整體進度
- 交期預警系統
- 施工狀態追蹤

## 🎯 系統優勢

1. **流程完整性** - 涵蓋從詢價到驗收的完整採購流程
2. **決策支援** - 提供多維度比較分析與決標建議
3. **成本控管** - 整合預算管理與 ERP 系統
4. **進度透明** - 即時追蹤交期與施工進度
5. **報表豐富** - 多種採購分析報表
6. **易於擴展** - 模組化設計，便於功能擴充

## 🔧 技術特色

- **純 JavaScript** - 無需額外依賴套件
- **物件導向設計** - 清晰的類別結構
- **服務分離** - 各功能模組獨立
- **響應式 Web UI** - Bootstrap 5 前端框架
- **記憶體資料庫** - 快速原型開發
- **模組化架構** - 便於維護與擴展

## 📈 演示資料

系統內建完整的演示流程，包含：
- 3家樣本供應商
- 完整的詢價到採購流程
- 多項目比價分析
- 進度追蹤演示
- 各類報表生成

執行 `node main.js` 查看完整演示！

## 🚀 未來擴展

- [ ] 資料庫持久化（MySQL/PostgreSQL）
- [ ] RESTful API 介面
- [ ] 使用者權限管理
- [ ] 電子簽核流程
- [ ] 行動端 App
- [ ] 即時通知系統
- [ ] 更多報表類型
- [ ] 供應商入口網站

## 📞 聯絡資訊

如有任何問題或建議，歡迎聯絡開發團隊。

---

**建設公司發包管理系統** - 讓採購管理更智慧、更高效！