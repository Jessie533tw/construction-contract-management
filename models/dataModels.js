class ProjectItem {
    constructor(itemId, itemName, specification, unit, quantity, estimatedUnitPrice = 0) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.specification = specification;
        this.unit = unit;
        this.quantity = quantity;
        this.estimatedUnitPrice = estimatedUnitPrice;
        this.estimatedTotalPrice = quantity * estimatedUnitPrice;
    }
}

class Supplier {
    constructor(supplierId, companyName, contactPerson, phone, email, address) {
        this.supplierId = supplierId;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.cooperationHistory = [];
    }
}

class Inquiry {
    constructor(inquiryId, projectName, projectCode, expectedOrderDate) {
        this.inquiryId = inquiryId;
        this.projectName = projectName;
        this.projectCode = projectCode;
        this.createDate = new Date();
        this.expectedOrderDate = new Date(expectedOrderDate);
        this.items = [];
        this.targetSuppliers = [];
        this.status = 'DRAFT';
    }

    addItem(projectItem) {
        this.items.push(projectItem);
    }

    addTargetSupplier(supplier) {
        this.targetSuppliers.push(supplier);
    }

    sendToSuppliers() {
        this.status = 'SENT';
        this.sentDate = new Date();
    }
}

class QuoteItem {
    constructor(itemId, unitPrice, totalPrice, deliveryDays, remarks = '') {
        this.itemId = itemId;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
        this.deliveryDays = deliveryDays;
        this.remarks = remarks;
    }
}

class Quote {
    constructor(quoteId, inquiryId, supplierId, quotedDate) {
        this.quoteId = quoteId;
        this.inquiryId = inquiryId;
        this.supplierId = supplierId;
        this.quotedDate = new Date(quotedDate);
        this.items = [];
        this.paymentTerms = '';
        this.validityDays = 30;
        this.totalAmount = 0;
        this.status = 'SUBMITTED';
    }

    addQuoteItem(quoteItem) {
        this.items.push(quoteItem);
        this.calculateTotal();
    }

    calculateTotal() {
        this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
}

class ComparisonTable {
    constructor(inquiryId, projectName) {
        this.inquiryId = inquiryId;
        this.projectName = projectName;
        this.createDate = new Date();
        this.quotes = [];
        this.evaluation = {};
        this.selectedSupplierId = null;
        this.decisionReason = '';
    }

    addQuote(quote) {
        this.quotes.push(quote);
    }

    generateComparison() {
        const comparison = {
            itemComparison: {},
            supplierSummary: {}
        };

        this.quotes.forEach(quote => {
            comparison.supplierSummary[quote.supplierId] = {
                totalAmount: quote.totalAmount,
                paymentTerms: quote.paymentTerms,
                averageDeliveryDays: this.calculateAverageDelivery(quote)
            };

            quote.items.forEach(item => {
                if (!comparison.itemComparison[item.itemId]) {
                    comparison.itemComparison[item.itemId] = {};
                }
                comparison.itemComparison[item.itemId][quote.supplierId] = {
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    deliveryDays: item.deliveryDays
                };
            });
        });

        return comparison;
    }

    calculateAverageDelivery(quote) {
        if (quote.items.length === 0) return 0;
        return quote.items.reduce((sum, item) => sum + item.deliveryDays, 0) / quote.items.length;
    }

    selectSupplier(supplierId, reason) {
        this.selectedSupplierId = supplierId;
        this.decisionReason = reason;
        this.decisionDate = new Date();
    }
}

class PurchaseOrder {
    constructor(poId, inquiryId, supplierId, projectName) {
        this.poId = poId;
        this.inquiryId = inquiryId;
        this.supplierId = supplierId;
        this.projectName = projectName;
        this.createDate = new Date();
        this.items = [];
        this.totalAmount = 0;
        this.paymentTerms = '';
        this.deliveryAddress = '';
        this.expectedDeliveryDate = null;
        this.status = 'CREATED';
    }

    addItem(itemId, itemName, specification, unit, quantity, unitPrice) {
        const item = {
            itemId,
            itemName,
            specification,
            unit,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice
        };
        this.items.push(item);
        this.calculateTotal();
    }

    calculateTotal() {
        this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    confirm() {
        this.status = 'CONFIRMED';
        this.confirmDate = new Date();
    }
}

class ConstructionSchedule {
    constructor(projectName, projectCode) {
        this.projectName = projectName;
        this.projectCode = projectCode;
        this.createDate = new Date();
        this.scheduleItems = [];
        this.overallProgress = 0;
    }

    addScheduleItem(poId, itemName, expectedDeliveryDate, actualDeliveryDate = null) {
        const scheduleItem = {
            poId,
            itemName,
            expectedDeliveryDate: new Date(expectedDeliveryDate),
            actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : null,
            status: 'PENDING',
            constructionProgress: 0
        };
        this.scheduleItems.push(scheduleItem);
    }

    updateDeliveryStatus(poId, actualDeliveryDate) {
        const item = this.scheduleItems.find(item => item.poId === poId);
        if (item) {
            item.actualDeliveryDate = new Date(actualDeliveryDate);
            item.status = 'DELIVERED';
        }
    }

    updateConstructionProgress(poId, progress) {
        const item = this.scheduleItems.find(item => item.poId === poId);
        if (item) {
            item.constructionProgress = progress;
            if (progress >= 100) {
                item.status = 'COMPLETED';
            }
        }
        this.calculateOverallProgress();
    }

    calculateOverallProgress() {
        if (this.scheduleItems.length === 0) return;
        this.overallProgress = this.scheduleItems.reduce((sum, item) => sum + item.constructionProgress, 0) / this.scheduleItems.length;
    }
}

class PurchaseDetailReport {
    constructor(projectName, reportType) {
        this.projectName = projectName;
        this.reportType = reportType;
        this.generateDate = new Date();
        this.details = [];
    }

    generateEngineeringReport(purchaseOrders) {
        this.details = purchaseOrders.map(po => ({
            poId: po.poId,
            supplierName: po.supplierName,
            projectPhase: po.projectPhase || '主體工程',
            items: po.items,
            totalAmount: po.totalAmount,
            deliveryStatus: po.status
        }));
    }

    generateMaterialReport(purchaseOrders) {
        const materialMap = {};
        
        purchaseOrders.forEach(po => {
            po.items.forEach(item => {
                const key = `${item.itemName}_${item.specification}`;
                if (!materialMap[key]) {
                    materialMap[key] = {
                        itemName: item.itemName,
                        specification: item.specification,
                        unit: item.unit,
                        totalQuantity: 0,
                        totalAmount: 0,
                        suppliers: []
                    };
                }
                materialMap[key].totalQuantity += item.quantity;
                materialMap[key].totalAmount += item.totalPrice;
                materialMap[key].suppliers.push({
                    supplierId: po.supplierId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                });
            });
        });

        this.details = Object.values(materialMap);
    }
}

module.exports = {
    ProjectItem,
    Supplier,
    Inquiry,
    QuoteItem,
    Quote,
    ComparisonTable,
    PurchaseOrder,
    ConstructionSchedule,
    PurchaseDetailReport
};