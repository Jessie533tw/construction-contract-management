const InquiryService = require('./services/inquiryService');
const ComparisonService = require('./services/comparisonService');
const PurchaseOrderService = require('./services/purchaseOrderService');
const ScheduleService = require('./services/scheduleService');
const ReportService = require('./services/reportService');
const { Supplier, ProjectItem } = require('./models/dataModels');

console.log('=== 建設公司發包管理系統 演示 ===\n');

const inquiryService = new InquiryService();
const comparisonService = new ComparisonService();
const purchaseOrderService = new PurchaseOrderService();
const scheduleService = new ScheduleService();
const reportService = new ReportService();

function createSampleData() {
    console.log('1. 建立樣本供應商資料...');
    
    const suppliers = [
        new Supplier('SUP001', '建材大廠股份有限公司', '王經理', '02-1234-5678', 'wang@buildmat.com', '台北市信義區'),
        new Supplier('SUP002', '鋼鐵工業有限公司', '李主任', '02-2345-6789', 'li@steel.com', '新北市板橋區'),
        new Supplier('SUP003', '混凝土供應商', '陳總監', '02-3456-7890', 'chen@concrete.com', '桃園市中壢區')
    ];
    
    suppliers.forEach(supplier => {
        inquiryService.registerSupplier(supplier);
        console.log(`   ✓ 註冊供應商: ${supplier.companyName}`);
    });
    
    console.log('   樣本供應商建立完成\n');
}

function demonstrateInquiryFlow() {
    console.log('2. 詢價單流程演示...');
    
    const inquiry = inquiryService.createInquiry(
        '辦公大樓專案',
        'PROJ001',
        '2024-02-15'
    );
    
    console.log(`   ✓ 建立詢價單: ${inquiry.inquiryId}`);
    
    const items = [
        { itemId: 'ITEM001', itemName: '鋼筋混凝土', specification: 'C240', unit: 'm3', quantity: 100, estimatedUnitPrice: 3500 },
        { itemId: 'ITEM002', itemName: '鋼筋', specification: '#4', unit: 'ton', quantity: 50, estimatedUnitPrice: 28000 },
        { itemId: 'ITEM003', itemName: '模板', specification: '18mm夾板', unit: 'm2', quantity: 200, estimatedUnitPrice: 120 }
    ];
    
    items.forEach(itemData => {
        inquiryService.addItemToInquiry(inquiry.inquiryId, itemData);
        console.log(`   ✓ 新增項目: ${itemData.itemName}`);
    });
    
    inquiryService.addSuppliersToInquiry(inquiry.inquiryId, ['SUP001', 'SUP002', 'SUP003']);
    console.log('   ✓ 指定目標供應商');
    
    inquiryService.sendInquiry(inquiry.inquiryId);
    console.log('   ✓ 詢價單發送完成\n');
    
    return inquiry.inquiryId;
}

function demonstrateQuoteSubmission(inquiryId) {
    console.log('3. 供應商報價流程演示...');
    
    const quotes = [
        {
            supplierId: 'SUP001',
            quotedDate: '2024-01-20',
            paymentTerms: '交貨後30天付款',
            validityDays: 45,
            items: [
                { itemId: 'ITEM001', unitPrice: 3400, totalPrice: 340000, deliveryDays: 14 },
                { itemId: 'ITEM002', unitPrice: 27500, totalPrice: 1375000, deliveryDays: 21 },
                { itemId: 'ITEM003', unitPrice: 115, totalPrice: 23000, deliveryDays: 7 }
            ]
        },
        {
            supplierId: 'SUP002',
            quotedDate: '2024-01-21',
            paymentTerms: '交貨後45天付款',
            validityDays: 30,
            items: [
                { itemId: 'ITEM001', unitPrice: 3600, totalPrice: 360000, deliveryDays: 10 },
                { itemId: 'ITEM002', unitPrice: 26800, totalPrice: 1340000, deliveryDays: 14 },
                { itemId: 'ITEM003', unitPrice: 125, totalPrice: 25000, deliveryDays: 5 }
            ]
        },
        {
            supplierId: 'SUP003',
            quotedDate: '2024-01-22',
            paymentTerms: '交貨後60天付款',
            validityDays: 60,
            items: [
                { itemId: 'ITEM001', unitPrice: 3300, totalPrice: 330000, deliveryDays: 18 },
                { itemId: 'ITEM002', unitPrice: 28500, totalPrice: 1425000, deliveryDays: 25 },
                { itemId: 'ITEM003', unitPrice: 110, totalPrice: 22000, deliveryDays: 10 }
            ]
        }
    ];
    
    const submittedQuotes = quotes.map(quoteData => {
        const quote = comparisonService.submitQuote(inquiryId, quoteData.supplierId, quoteData);
        console.log(`   ✓ ${quoteData.supplierId} 提交報價，總額: $${quote.totalAmount.toLocaleString()}`);
        return quote;
    });
    
    console.log('   供應商報價提交完成\n');
    return submittedQuotes;
}

function demonstrateComparison(inquiryId) {
    console.log('4. 發包計價比較表演示...');
    
    const comparisonTable = comparisonService.createComparisonTable(inquiryId, '辦公大樓專案');
    console.log('   ✓ 建立計價比較表');
    
    const analysis = comparisonService.generateDetailedComparison(inquiryId);
    console.log('\n   📊 比較分析結果:');
    console.log(`   參與廠商數: ${analysis.基本資訊.參與廠商數}`);
    console.log(`   最低總價: $${analysis.價格分析.最低總價.toLocaleString()}`);
    console.log(`   最高總價: $${analysis.價格分析.最高總價.toLocaleString()}`);
    console.log(`   價格差距: ${analysis.價格分析.價格差距百分比}`);
    console.log(`   建議決標廠商: ${analysis.建議決標.綜合建議}`);
    
    comparisonService.selectSupplier(inquiryId, 'SUP002', '價格合理且交期最優');
    console.log('   ✓ 決標完成\n');
    
    return 'SUP002';
}

function demonstratePurchaseOrder(inquiryId, selectedSupplierId) {
    console.log('5. 採購單生成與管理演示...');
    
    const selectedQuote = comparisonService.getQuotesByInquiry(inquiryId)
        .find(quote => quote.supplierId === selectedSupplierId);
    
    purchaseOrderService.setBudgetModule('辦公大樓專案', 50000000, 5000000);
    
    const po = purchaseOrderService.generatePurchaseOrder(
        inquiryId,
        selectedSupplierId,
        selectedQuote,
        '辦公大樓專案',
        '台北市信義區工地'
    );
    
    console.log(`   ✓ 生成採購單: ${po.poId}`);
    console.log(`   總金額: $${po.totalAmount.toLocaleString()}`);
    
    purchaseOrderService.confirmPurchaseOrder(po.poId);
    console.log('   ✓ 採購單確認，預算已扣除\n');
    
    return po;
}

function demonstrateScheduleManagement(purchaseOrder) {
    console.log('6. 發包施工進度表演示...');
    
    const schedule = scheduleService.createConstructionSchedule('辦公大樓專案', 'PROJ001');
    console.log('   ✓ 建立施工進度表');
    
    scheduleService.addPurchaseOrderToSchedule('PROJ001', purchaseOrder);
    console.log('   ✓ 採購單加入進度表');
    
    scheduleService.updateDeliveryStatus('PROJ001', purchaseOrder.poId, '2024-02-01');
    console.log('   ✓ 更新交貨狀態');
    
    scheduleService.updateConstructionProgress('PROJ001', purchaseOrder.poId, 75, '施工進度良好');
    console.log('   ✓ 更新施工進度至75%');
    
    const report = scheduleService.generateScheduleReport('PROJ001');
    console.log('\n   📈 進度表報告:');
    console.log(`   整體進度: ${report.專案資訊.整體進度}`);
    console.log(`   總項目數: ${report.進度統計.總項目數}`);
    console.log(`   已交貨: ${report.進度統計.已交貨}`);
    console.log(`   準時交貨率: ${report.交期分析.準時交貨率}\n`);
    
    return schedule;
}

function demonstrateReports(purchaseOrders) {
    console.log('7. 採購明細報表演示...');
    
    const engineeringReport = reportService.generateEngineeringPurchaseReport(
        '辦公大樓專案',
        purchaseOrders
    );
    console.log('   ✓ 生成工程採購明細表');
    console.log(`   總採購單數: ${engineeringReport.統計摘要.總採購單數}`);
    console.log(`   總採購金額: $${engineeringReport.統計摘要.總採購金額.toLocaleString()}`);
    
    const materialReport = reportService.generateMaterialPurchaseReport(
        '辦公大樓專案',
        purchaseOrders
    );
    console.log('   ✓ 生成工料採購明細表');
    console.log(`   材料項目總數: ${materialReport.統計摘要.材料項目總數}`);
    console.log(`   參與供應商數: ${materialReport.統計摘要.參與供應商數}`);
    
    console.log('\n   📋 報表已生成完成\n');
}

function runDemo() {
    try {
        createSampleData();
        
        const inquiryId = demonstrateInquiryFlow();
        
        demonstrateQuoteSubmission(inquiryId);
        
        const selectedSupplierId = demonstrateComparison(inquiryId);
        
        const purchaseOrder = demonstratePurchaseOrder(inquiryId, selectedSupplierId);
        
        demonstrateScheduleManagement(purchaseOrder);
        
        demonstrateReports([purchaseOrder]);
        
        console.log('=== 演示完成！系統運行正常 ===');
        
        console.log('\n📝 系統功能概要:');
        console.log('1. ✅ 詢價單管理 - 建立、發送、追蹤');
        console.log('2. ✅ 發包計價比較表 - 多家廠商報價比較分析');
        console.log('3. ✅ 採購單管理 - 自動生成、預算控制、ERP整合');
        console.log('4. ✅ 發包施工進度表 - 交期追蹤、進度管理');
        console.log('5. ✅ 採購明細報表 - 工程採購表、工料採購表');
        console.log('6. ✅ 供應商管理 - 資料維護、績效分析');
        
    } catch (error) {
        console.error('演示過程中發生錯誤:', error);
    }
}

if (require.main === module) {
    runDemo();
}

module.exports = {
    runDemo,
    inquiryService,
    comparisonService,
    purchaseOrderService,
    scheduleService,
    reportService
};