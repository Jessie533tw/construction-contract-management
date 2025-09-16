const { 
    inquiryService, 
    comparisonService, 
    purchaseOrderService, 
    reportService 
} = require('./main');
const { Supplier } = require('./models/dataModels');

console.log('=== 建設公司發包管理系統 - 手動測試 ===\n');

function testUserScenario() {
    console.log('👤 使用者情境測試開始...\n');
    
    // 1. 註冊新供應商
    const newSupplier = new Supplier(
        'SUP999', 
        '測試建材公司', 
        '張經理', 
        '02-9999-8888', 
        'test@supplier.com', 
        '台北市測試區'
    );
    
    inquiryService.registerSupplier(newSupplier);
    console.log('✅ 新增測試供應商成功');
    
    // 2. 建立新詢價單
    const testInquiry = inquiryService.createInquiry(
        '測試住宅專案',
        'TEST2024',
        '2024-03-15'
    );
    
    console.log(`✅ 建立測試詢價單: ${testInquiry.inquiryId}`);
    
    // 3. 新增多個採購項目
    const testItems = [
        { itemId: 'T001', itemName: '水泥', specification: '325號', unit: '包', quantity: 500, estimatedUnitPrice: 180 },
        { itemId: 'T002', itemName: '紅磚', specification: '標準磚', unit: '千塊', quantity: 20, estimatedUnitPrice: 400 },
        { itemId: 'T003', itemName: '鋼筋', specification: '#5', unit: '噸', quantity: 15, estimatedUnitPrice: 30000 }
    ];
    
    testItems.forEach(item => {
        inquiryService.addItemToInquiry(testInquiry.inquiryId, item);
        console.log(`  ➕ 新增項目: ${item.itemName} (${item.quantity} ${item.unit})`);
    });
    
    // 4. 指定供應商並發送
    inquiryService.addSuppliersToInquiry(testInquiry.inquiryId, ['SUP001', 'SUP999']);
    inquiryService.sendInquiry(testInquiry.inquiryId);
    console.log('✅ 詢價單已發送給 2 家供應商\n');
    
    // 5. 模擬廠商報價
    const testQuotes = [
        {
            supplierId: 'SUP001',
            quotedDate: '2024-02-05',
            paymentTerms: '貨到付款',
            items: [
                { itemId: 'T001', unitPrice: 175, totalPrice: 87500, deliveryDays: 7 },
                { itemId: 'T002', unitPrice: 390, totalPrice: 7800, deliveryDays: 10 },
                { itemId: 'T003', unitPrice: 29500, totalPrice: 442500, deliveryDays: 14 }
            ]
        },
        {
            supplierId: 'SUP999',
            quotedDate: '2024-02-06', 
            paymentTerms: '月結30天',
            items: [
                { itemId: 'T001', unitPrice: 170, totalPrice: 85000, deliveryDays: 5 },
                { itemId: 'T002', unitPrice: 385, totalPrice: 7700, deliveryDays: 8 },
                { itemId: 'T003', unitPrice: 29800, totalPrice: 447000, deliveryDays: 12 }
            ]
        }
    ];
    
    testQuotes.forEach(quoteData => {
        const quote = comparisonService.submitQuote(testInquiry.inquiryId, quoteData.supplierId, quoteData);
        console.log(`✅ ${quoteData.supplierId} 提交報價: $${quote.totalAmount.toLocaleString()}`);
    });
    
    // 6. 先建立比較表，再生成分析
    const comparisonTable = comparisonService.createComparisonTable(testInquiry.inquiryId, '測試住宅專案');
    const comparison = comparisonService.generateDetailedComparison(testInquiry.inquiryId);
    console.log('\n📊 比較分析結果:');
    console.log(`最低總價: $${comparison.價格分析.最低總價.toLocaleString()}`);
    console.log(`價格差距: ${comparison.價格分析.價格差距百分比}`);
    console.log(`建議決標: ${comparison.建議決標.綜合建議}`);
    
    // 7. 決標並生成採購單
    const selectedSupplier = comparison.建議決標.綜合建議;
    comparisonService.selectSupplier(testInquiry.inquiryId, selectedSupplier, '綜合評估最佳');
    
    const selectedQuote = comparisonService.getQuotesByInquiry(testInquiry.inquiryId)
        .find(q => q.supplierId === selectedSupplier);
    
    // 8. 設定預算並生成採購單
    purchaseOrderService.setBudgetModule('測試住宅專案', 2000000, 200000);
    
    const testPO = purchaseOrderService.generatePurchaseOrder(
        testInquiry.inquiryId,
        selectedSupplier,
        selectedQuote,
        '測試住宅專案',
        '新北市測試工地'
    );
    
    console.log(`✅ 生成採購單: ${testPO.poId} (總額: $${testPO.totalAmount.toLocaleString()})`);
    
    // 9. 確認採購單
    purchaseOrderService.confirmPurchaseOrder(testPO.poId);
    console.log('✅ 採購單已確認，預算已扣除');
    
    // 10. 生成報表
    const engineeringReport = reportService.generateEngineeringPurchaseReport(
        '測試住宅專案', 
        [testPO]
    );
    
    console.log('\n📋 工程採購明細表:');
    console.log(`報表編號: ${engineeringReport.報表基本資訊.報表編號}`);
    console.log(`總採購金額: $${engineeringReport.統計摘要.總採購金額.toLocaleString()}`);
    
    console.log('\n🎉 使用者情境測試完成！所有功能運作正常。');
}

function testSystemFeatures() {
    console.log('\n🔧 系統功能完整性測試...\n');
    
    // 測試詢價單管理功能
    console.log('1. 測試詢價單管理功能...');
    const inquiryReport = inquiryService.generateInquiryReport();
    console.log(`   ✓ 詢價單總數: ${inquiryReport.總詢價單數}`);
    console.log(`   ✓ 已發送: ${inquiryReport.已發送}`);
    
    // 測試採購單統計
    console.log('2. 測試採購單統計功能...');
    const allPOs = purchaseOrderService.getAllPurchaseOrders();
    const poReport = purchaseOrderService.generatePurchaseReport('2024-01-01', '2024-12-31');
    console.log(`   ✓ 採購單總數: ${poReport.總體統計.總採購單數}`);
    console.log(`   ✓ 總採購金額: $${poReport.總體統計.總採購金額.toLocaleString()}`);
    
    // 測試供應商管理
    console.log('3. 測試供應商管理功能...');
    const allSuppliers = inquiryService.getAllSuppliers();
    console.log(`   ✓ 註冊供應商數: ${allSuppliers.length}`);
    
    allSuppliers.forEach(supplier => {
        console.log(`   - ${supplier.companyName} (${supplier.supplierId})`);
    });
    
    console.log('\n✅ 系統功能測試完成！');
}

// 執行測試
try {
    testUserScenario();
    testSystemFeatures();
} catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
}