const { PurchaseOrder } = require('../models/dataModels');

class PurchaseOrderService {
    constructor() {
        this.purchaseOrders = new Map();
        this.currentPOId = 1;
        this.budgetModule = new Map();
        this.erpIntegration = new ERPIntegration();
    }

    generatePurchaseOrder(inquiryId, selectedSupplierId, selectedQuote, projectName, deliveryAddress) {
        const poId = `PO${String(this.currentPOId).padStart(6, '0')}`;
        const po = new PurchaseOrder(poId, inquiryId, selectedSupplierId, projectName);
        
        po.deliveryAddress = deliveryAddress;
        po.paymentTerms = selectedQuote.paymentTerms;
        
        const expectedDeliveryDays = Math.max(...selectedQuote.items.map(item => item.deliveryDays));
        po.expectedDeliveryDate = new Date();
        po.expectedDeliveryDate.setDate(po.expectedDeliveryDate.getDate() + expectedDeliveryDays);

        selectedQuote.items.forEach(quoteItem => {
            const projectItem = this.getProjectItemDetails(quoteItem.itemId);
            po.addItem(
                quoteItem.itemId,
                projectItem.itemName,
                projectItem.specification,
                projectItem.unit,
                projectItem.quantity,
                quoteItem.unitPrice
            );
        });

        this.purchaseOrders.set(poId, po);
        this.currentPOId++;

        console.log(`採購單 ${poId} 已生成，總金額: ${po.totalAmount}`);
        return po;
    }

    confirmPurchaseOrder(poId) {
        const po = this.purchaseOrders.get(poId);
        if (!po) {
            throw new Error(`採購單 ${poId} 不存在`);
        }

        try {
            this.validateBudget(po);
            
            po.confirm();
            
            this.erpIntegration.deductBudget(po.projectName, po.totalAmount);
            
            this.erpIntegration.updateCostControl(po);
            
            console.log(`採購單 ${poId} 已確認下單，預算已扣除 ${po.totalAmount}`);
            
            return po;
        } catch (error) {
            throw new Error(`採購單確認失敗: ${error.message}`);
        }
    }

    validateBudget(purchaseOrder) {
        const projectBudget = this.budgetModule.get(purchaseOrder.projectName);
        if (!projectBudget) {
            throw new Error(`專案 ${purchaseOrder.projectName} 預算資訊不存在`);
        }

        if (projectBudget.remainingBudget < purchaseOrder.totalAmount) {
            throw new Error(`預算不足，剩餘預算: ${projectBudget.remainingBudget}，需要金額: ${purchaseOrder.totalAmount}`);
        }

        return true;
    }

    updatePurchaseOrderStatus(poId, status, remarks = '') {
        const po = this.purchaseOrders.get(poId);
        if (!po) {
            throw new Error(`採購單 ${poId} 不存在`);
        }

        const previousStatus = po.status;
        po.status = status;
        po.lastUpdateDate = new Date();
        
        if (remarks) {
            if (!po.statusHistory) po.statusHistory = [];
            po.statusHistory.push({
                date: new Date(),
                previousStatus,
                newStatus: status,
                remarks
            });
        }

        console.log(`採購單 ${poId} 狀態已更新: ${previousStatus} → ${status}`);
        return po;
    }

    getPurchaseOrder(poId) {
        return this.purchaseOrders.get(poId);
    }

    getAllPurchaseOrders() {
        return Array.from(this.purchaseOrders.values());
    }

    getPurchaseOrdersByProject(projectName) {
        return Array.from(this.purchaseOrders.values())
            .filter(po => po.projectName === projectName);
    }

    getPurchaseOrdersBySupplier(supplierId) {
        return Array.from(this.purchaseOrders.values())
            .filter(po => po.supplierId === supplierId);
    }

    getPurchaseOrdersByStatus(status) {
        return Array.from(this.purchaseOrders.values())
            .filter(po => po.status === status);
    }

    updateDeliveryInfo(poId, actualDeliveryDate, deliveryStatus = 'DELIVERED') {
        const po = this.purchaseOrders.get(poId);
        if (!po) {
            throw new Error(`採購單 ${poId} 不存在`);
        }

        po.actualDeliveryDate = new Date(actualDeliveryDate);
        po.deliveryStatus = deliveryStatus;
        
        const deliveryDelay = Math.ceil((po.actualDeliveryDate - po.expectedDeliveryDate) / (1000 * 60 * 60 * 24));
        po.deliveryDelay = deliveryDelay;

        if (deliveryDelay > 0) {
            console.log(`採購單 ${poId} 延遲交貨 ${deliveryDelay} 天`);
        } else {
            console.log(`採購單 ${poId} 準時交貨`);
        }

        return po;
    }

    generatePurchaseReport(dateFrom, dateTo, projectName = null) {
        let orders = Array.from(this.purchaseOrders.values());

        if (dateFrom) {
            orders = orders.filter(po => po.createDate >= new Date(dateFrom));
        }
        if (dateTo) {
            orders = orders.filter(po => po.createDate <= new Date(dateTo));
        }
        if (projectName) {
            orders = orders.filter(po => po.projectName === projectName);
        }

        const report = {
            統計期間: {
                開始日期: dateFrom ? new Date(dateFrom).toLocaleDateString() : '不限',
                結束日期: dateTo ? new Date(dateTo).toLocaleDateString() : '不限',
                專案名稱: projectName || '全部專案'
            },
            總體統計: {
                總採購單數: orders.length,
                總採購金額: orders.reduce((sum, po) => sum + po.totalAmount, 0),
                已確認數量: orders.filter(po => po.status === 'CONFIRMED').length,
                待交貨數量: orders.filter(po => po.status === 'CONFIRMED' && !po.actualDeliveryDate).length,
                已交貨數量: orders.filter(po => po.actualDeliveryDate).length
            },
            交期分析: this.analyzeDeliveryPerformance(orders),
            供應商分析: this.analyzeSupplierPerformance(orders),
            詳細清單: orders.map(po => ({
                採購單號: po.poId,
                專案名稱: po.projectName,
                供應商編號: po.supplierId,
                建立日期: po.createDate.toLocaleDateString(),
                總金額: po.totalAmount,
                狀態: po.status,
                預計交期: po.expectedDeliveryDate ? po.expectedDeliveryDate.toLocaleDateString() : '',
                實際交期: po.actualDeliveryDate ? po.actualDeliveryDate.toLocaleDateString() : '',
                交期延遲: po.deliveryDelay || 0
            }))
        };

        return report;
    }

    analyzeDeliveryPerformance(orders) {
        const deliveredOrders = orders.filter(po => po.actualDeliveryDate);
        
        if (deliveredOrders.length === 0) {
            return { 準時交貨率: '0%', 平均延遲天數: 0 };
        }

        const onTimeOrders = deliveredOrders.filter(po => po.deliveryDelay <= 0);
        const totalDelay = deliveredOrders.reduce((sum, po) => sum + Math.max(0, po.deliveryDelay || 0), 0);

        return {
            準時交貨率: ((onTimeOrders.length / deliveredOrders.length) * 100).toFixed(1) + '%',
            平均延遲天數: (totalDelay / deliveredOrders.length).toFixed(1),
            最大延遲天數: Math.max(...deliveredOrders.map(po => po.deliveryDelay || 0))
        };
    }

    analyzeSupplierPerformance(orders) {
        const supplierStats = {};

        orders.forEach(po => {
            if (!supplierStats[po.supplierId]) {
                supplierStats[po.supplierId] = {
                    採購次數: 0,
                    總金額: 0,
                    準時交貨次數: 0,
                    已交貨次數: 0
                };
            }

            const stats = supplierStats[po.supplierId];
            stats.採購次數++;
            stats.總金額 += po.totalAmount;

            if (po.actualDeliveryDate) {
                stats.已交貨次數++;
                if (po.deliveryDelay <= 0) {
                    stats.準時交貨次數++;
                }
            }
        });

        Object.keys(supplierStats).forEach(supplierId => {
            const stats = supplierStats[supplierId];
            stats.準時交貨率 = stats.已交貨次數 > 0 
                ? ((stats.準時交貨次數 / stats.已交貨次數) * 100).toFixed(1) + '%'
                : 'N/A';
        });

        return supplierStats;
    }

    exportPurchaseOrderToExcel(poId) {
        const po = this.purchaseOrders.get(poId);
        if (!po) {
            throw new Error(`採購單 ${poId} 不存在`);
        }

        return {
            採購單資訊: {
                採購單號: po.poId,
                專案名稱: po.projectName,
                供應商編號: po.supplierId,
                建立日期: po.createDate.toLocaleDateString(),
                總金額: po.totalAmount,
                付款條件: po.paymentTerms,
                交貨地址: po.deliveryAddress,
                預計交期: po.expectedDeliveryDate ? po.expectedDeliveryDate.toLocaleDateString() : '',
                狀態: po.status
            },
            採購項目: po.items.map(item => ({
                項目編號: item.itemId,
                項目名稱: item.itemName,
                規格: item.specification,
                單位: item.unit,
                數量: item.quantity,
                單價: item.unitPrice,
                總價: item.totalPrice
            }))
        };
    }

    getProjectItemDetails(itemId) {
        return {
            itemName: `項目-${itemId}`,
            specification: '標準規格',
            unit: '式',
            quantity: 1
        };
    }

    setBudgetModule(projectName, totalBudget, usedBudget = 0) {
        this.budgetModule.set(projectName, {
            totalBudget,
            usedBudget,
            remainingBudget: totalBudget - usedBudget
        });
    }

    getBudgetStatus(projectName) {
        return this.budgetModule.get(projectName);
    }
}

class ERPIntegration {
    constructor() {
        this.costControlModule = new Map();
    }

    deductBudget(projectName, amount) {
        console.log(`ERP系統：專案 ${projectName} 扣除預算 ${amount}`);
        return true;
    }

    updateCostControl(purchaseOrder) {
        const costData = {
            projectName: purchaseOrder.projectName,
            poId: purchaseOrder.poId,
            amount: purchaseOrder.totalAmount,
            updateDate: new Date(),
            status: '已採購'
        };

        this.costControlModule.set(purchaseOrder.poId, costData);
        console.log(`成本控管模組已更新：採購單 ${purchaseOrder.poId}`);
        return costData;
    }

    getCostControlData(projectName) {
        return Array.from(this.costControlModule.values())
            .filter(data => data.projectName === projectName);
    }
}

module.exports = PurchaseOrderService;