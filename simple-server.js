const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 引入記憶體版本的服務
const InquiryService = require('./services/inquiryService');
const ComparisonService = require('./services/comparisonService');
const PurchaseOrderService = require('./services/purchaseOrderService');
const ScheduleService = require('./services/scheduleService');
const ReportService = require('./services/reportService');

// 引入資料模型
const { Supplier, ProjectItem } = require('./models/dataModels');

const app = express();
const PORT = process.env.PORT || 3001;

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 提供靜態檔案
app.use(express.static(path.join(__dirname)));

// 初始化服務
const inquiryService = new InquiryService();
const comparisonService = new ComparisonService();
const purchaseOrderService = new PurchaseOrderService();
const scheduleService = new ScheduleService();
const reportService = new ReportService();

// 建立樣本資料
const sampleSuppliers = [
    new Supplier('SUP001', '建材大廠股份有限公司', '王經理', '02-2345-6789', 'wang@construction.com', '台北市信義區建材路123號'),
    new Supplier('SUP002', '鋼鐵工業有限公司', '李經理', '02-3456-7890', 'li@steel.com', '台北市大安區鋼鐵街45號'),
    new Supplier('SUP003', '混凝土供應商', '陳經理', '02-4567-8901', 'chen@concrete.com', '新北市中和區混凝土大道67號')
];

// API 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康檢查
app.get('/api/health', (req, res) => {
    res.json({
        message: '建設發包管理系統運行正常',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 供應商 API
app.get('/api/suppliers', (req, res) => {
    res.json(sampleSuppliers);
});

// 詢價單 API
app.get('/api/inquiries', (req, res) => {
    res.json(inquiryService.getAllInquiries());
});

app.post('/api/inquiries', (req, res) => {
    try {
        const { projectName, projectCode, expectedOrderDate } = req.body;
        const inquiry = inquiryService.createInquiry(projectName, projectCode, expectedOrderDate);
        res.json({ success: true, inquiry });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/inquiries/:id/items', (req, res) => {
    try {
        const { itemName, specification, unit, quantity, estimatedUnitPrice } = req.body;
        const item = new ProjectItem(`ITEM${Date.now()}`, itemName, specification, unit, quantity, estimatedUnitPrice);
        inquiryService.addItemToInquiry(req.params.id, item);
        res.json({ success: true, item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/inquiries/:id/suppliers', (req, res) => {
    try {
        const { supplierIds } = req.body;
        inquiryService.addSuppliersToInquiry(req.params.id, supplierIds);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/inquiries/:id/send', (req, res) => {
    try {
        inquiryService.sendInquiry(req.params.id);
        res.json({ success: true, message: '詢價單已發送' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 報價 API
app.post('/api/quotations', (req, res) => {
    try {
        const { inquiryId, supplierId, quotedDate, paymentTerms, items } = req.body;
        const quote = comparisonService.submitQuote(inquiryId, supplierId, {
            quotedDate,
            paymentTerms,
            items
        });
        res.json({ success: true, quote });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/inquiries/:id/comparison', (req, res) => {
    try {
        const comparison = comparisonService.generateDetailedComparison(req.params.id);
        res.json(comparison);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/quotations/:inquiryId/select', (req, res) => {
    try {
        const { supplierId, reason } = req.body;
        comparisonService.selectSupplier(req.params.inquiryId, supplierId, reason);
        res.json({ success: true, message: '供應商已選定' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 採購單 API
app.post('/api/purchase-orders', (req, res) => {
    try {
        const { inquiryId, supplierId, projectName, deliveryLocation } = req.body;

        // 設定預算模組
        purchaseOrderService.setBudgetModule(projectName, 50000000, 5000000);

        const selectedQuote = comparisonService.getSelectedQuote(inquiryId, supplierId);
        const po = purchaseOrderService.generatePurchaseOrder(
            inquiryId,
            supplierId,
            selectedQuote,
            projectName,
            deliveryLocation
        );

        res.json({ success: true, purchaseOrder: po });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/purchase-orders/:id/confirm', (req, res) => {
    try {
        purchaseOrderService.confirmPurchaseOrder(req.params.id);
        res.json({ success: true, message: '採購單已確認' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 進度 API
app.post('/api/schedules', (req, res) => {
    try {
        const { projectName, projectCode } = req.body;
        const schedule = scheduleService.createConstructionSchedule(projectName, projectCode);
        res.json({ success: true, schedule });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/schedules/:projectCode/purchase-orders', (req, res) => {
    try {
        const { purchaseOrder } = req.body;
        scheduleService.addPurchaseOrderToSchedule(req.params.projectCode, purchaseOrder);
        res.json({ success: true, message: '採購單已加入進度表' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.put('/api/schedules/:projectCode/delivery/:poId', (req, res) => {
    try {
        const { deliveryDate } = req.body;
        scheduleService.updateDeliveryStatus(req.params.projectCode, req.params.poId, deliveryDate);
        res.json({ success: true, message: '交貨狀態已更新' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.put('/api/schedules/:projectCode/progress/:poId', (req, res) => {
    try {
        const { progress, notes } = req.body;
        scheduleService.updateConstructionProgress(req.params.projectCode, req.params.poId, progress, notes);
        res.json({ success: true, message: '施工進度已更新' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 報表 API
app.get('/api/reports/engineering/:projectName', (req, res) => {
    try {
        const purchaseOrders = purchaseOrderService.getAllPurchaseOrders();
        const report = reportService.generateEngineeringPurchaseReport(req.params.projectName, purchaseOrders);
        res.json(report);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/reports/material/:projectName', (req, res) => {
    try {
        const purchaseOrders = purchaseOrderService.getAllPurchaseOrders();
        const report = reportService.generateMaterialPurchaseReport(req.params.projectName, purchaseOrders);
        res.json(report);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: '伺服器內部錯誤' });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ success: false, error: '找不到請求的資源' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏗️  建設發包管理系統伺服器啟動成功！`);
    console.log(`📊 伺服器運行在: http://0.0.0.0:${PORT}`);
    console.log(`🌐 Web 介面: http://0.0.0.0:${PORT}`);
    console.log(`🔗 API 端點: http://0.0.0.0:${PORT}/api`);
    console.log(`📋 健康檢查: http://0.0.0.0:${PORT}/api/health`);
});

module.exports = app;