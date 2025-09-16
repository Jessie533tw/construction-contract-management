const { PurchaseDetailReport } = require('../models/dataModels');

class ReportService {
    constructor() {
        this.reports = new Map();
        this.reportTemplates = new Map();
        this.currentReportId = 1;
    }

    generateEngineeringPurchaseReport(projectName, purchaseOrders, dateFrom = null, dateTo = null) {
        const reportId = `ENG${String(this.currentReportId).padStart(6, '0')}`;
        const report = new PurchaseDetailReport(projectName, 'ENGINEERING');
        
        let filteredOrders = purchaseOrders;
        
        if (dateFrom || dateTo) {
            filteredOrders = purchaseOrders.filter(po => {
                const orderDate = po.createDate;
                let include = true;
                
                if (dateFrom && orderDate < new Date(dateFrom)) include = false;
                if (dateTo && orderDate > new Date(dateTo)) include = false;
                
                return include;
            });
        }

        report.generateEngineeringReport(filteredOrders);
        
        const detailedReport = {
            報表基本資訊: {
                報表編號: reportId,
                報表類型: '工程採購明細表',
                專案名稱: projectName,
                產生日期: report.generateDate.toLocaleDateString(),
                統計期間: {
                    起始日期: dateFrom ? new Date(dateFrom).toLocaleDateString() : '不限',
                    結束日期: dateTo ? new Date(dateTo).toLocaleDateString() : '不限'
                }
            },
            
            統計摘要: {
                總採購單數: filteredOrders.length,
                總採購金額: filteredOrders.reduce((sum, po) => sum + po.totalAmount, 0),
                已完成採購: filteredOrders.filter(po => po.status === 'CONFIRMED').length,
                進行中採購: filteredOrders.filter(po => po.status === 'CREATED').length
            },

            分項工程統計: this.analyzeByProjectPhase(filteredOrders),
            
            供應商統計: this.analyzeBySupplier(filteredOrders),
            
            採購明細: report.details.map(detail => ({
                採購單號: detail.poId,
                供應商名稱: detail.supplierName,
                專案階段: detail.projectPhase,
                採購金額: detail.totalAmount,
                交貨狀態: detail.deliveryStatus,
                項目清單: detail.items.map(item => ({
                    項目名稱: item.itemName,
                    規格: item.specification,
                    數量: item.quantity,
                    單位: item.unit,
                    單價: item.unitPrice,
                    總價: item.totalPrice
                }))
            })),

            成本分析: this.analyzeCostBreakdown(filteredOrders)
        };

        this.reports.set(reportId, detailedReport);
        this.currentReportId++;
        
        return detailedReport;
    }

    generateMaterialPurchaseReport(projectName, purchaseOrders, dateFrom = null, dateTo = null) {
        const reportId = `MAT${String(this.currentReportId).padStart(6, '0')}`;
        const report = new PurchaseDetailReport(projectName, 'MATERIAL');
        
        let filteredOrders = purchaseOrders;
        
        if (dateFrom || dateTo) {
            filteredOrders = purchaseOrders.filter(po => {
                const orderDate = po.createDate;
                let include = true;
                
                if (dateFrom && orderDate < new Date(dateFrom)) include = false;
                if (dateTo && orderDate > new Date(dateTo)) include = false;
                
                return include;
            });
        }

        report.generateMaterialReport(filteredOrders);

        const detailedReport = {
            報表基本資訊: {
                報表編號: reportId,
                報表類型: '工料採購明細表',
                專案名稱: projectName,
                產生日期: report.generateDate.toLocaleDateString(),
                統計期間: {
                    起始日期: dateFrom ? new Date(dateFrom).toLocaleDateString() : '不限',
                    結束日期: dateTo ? new Date(dateTo).toLocaleDateString() : '不限'
                }
            },

            統計摘要: {
                材料項目總數: report.details.length,
                總採購金額: report.details.reduce((sum, item) => sum + item.totalAmount, 0),
                參與供應商數: this.getUniqueSupplierCount(report.details),
                平均單價範圍: this.calculatePriceRange(report.details)
            },

            材料分類統計: this.analyzeMaterialCategories(report.details),
            
            供應商材料統計: this.analyzeMaterialSuppliers(report.details),

            材料明細: report.details.map(material => ({
                材料名稱: material.itemName,
                規格: material.specification,
                單位: material.unit,
                總採購數量: material.totalQuantity,
                總採購金額: material.totalAmount,
                平均單價: (material.totalAmount / material.totalQuantity).toFixed(2),
                供應商資訊: material.suppliers.map(supplier => ({
                    供應商編號: supplier.supplierId,
                    採購數量: supplier.quantity,
                    單價: supplier.unitPrice,
                    小計: supplier.quantity * supplier.unitPrice
                }))
            })),

            價格分析: this.analyzeMaterialPrices(report.details)
        };

        this.reports.set(reportId, detailedReport);
        this.currentReportId++;
        
        return detailedReport;
    }

    analyzeByProjectPhase(purchaseOrders) {
        const phaseStats = {};
        
        purchaseOrders.forEach(po => {
            const phase = po.projectPhase || '主體工程';
            if (!phaseStats[phase]) {
                phaseStats[phase] = {
                    採購單數: 0,
                    總金額: 0,
                    項目數: 0
                };
            }
            
            phaseStats[phase].採購單數++;
            phaseStats[phase].總金額 += po.totalAmount;
            phaseStats[phase].項目數 += po.items.length;
        });

        return phaseStats;
    }

    analyzeBySupplier(purchaseOrders) {
        const supplierStats = {};
        
        purchaseOrders.forEach(po => {
            if (!supplierStats[po.supplierId]) {
                supplierStats[po.supplierId] = {
                    採購次數: 0,
                    總採購金額: 0,
                    項目種類: new Set()
                };
            }
            
            const stats = supplierStats[po.supplierId];
            stats.採購次數++;
            stats.總採購金額 += po.totalAmount;
            po.items.forEach(item => stats.項目種類.add(item.itemName));
        });

        Object.keys(supplierStats).forEach(supplierId => {
            supplierStats[supplierId].項目種類數 = supplierStats[supplierId].項目種類.size;
            delete supplierStats[supplierId].項目種類;
        });

        return supplierStats;
    }

    analyzeCostBreakdown(purchaseOrders) {
        const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
        const costByCategory = {};

        purchaseOrders.forEach(po => {
            po.items.forEach(item => {
                const category = this.categorizeItem(item.itemName);
                if (!costByCategory[category]) {
                    costByCategory[category] = 0;
                }
                costByCategory[category] += item.totalPrice;
            });
        });

        return {
            總成本: totalAmount,
            成本分布: Object.entries(costByCategory).map(([category, amount]) => ({
                類別: category,
                金額: amount,
                占比: ((amount / totalAmount) * 100).toFixed(2) + '%'
            }))
        };
    }

    analyzeMaterialCategories(materials) {
        const categories = {};
        
        materials.forEach(material => {
            const category = this.categorizeItem(material.itemName);
            if (!categories[category]) {
                categories[category] = {
                    項目數: 0,
                    總金額: 0,
                    總數量: 0
                };
            }
            
            categories[category].項目數++;
            categories[category].總金額 += material.totalAmount;
            categories[category].總數量 += material.totalQuantity;
        });

        return categories;
    }

    analyzeMaterialSuppliers(materials) {
        const supplierMaterials = {};
        
        materials.forEach(material => {
            material.suppliers.forEach(supplier => {
                if (!supplierMaterials[supplier.supplierId]) {
                    supplierMaterials[supplier.supplierId] = {
                        供應材料數: 0,
                        總供應金額: 0,
                        材料清單: []
                    };
                }
                
                const supplierData = supplierMaterials[supplier.supplierId];
                supplierData.供應材料數++;
                supplierData.總供應金額 += supplier.quantity * supplier.unitPrice;
                supplierData.材料清單.push({
                    材料名稱: material.itemName,
                    數量: supplier.quantity,
                    單價: supplier.unitPrice
                });
            });
        });

        return supplierMaterials;
    }

    analyzeMaterialPrices(materials) {
        const priceAnalysis = {};
        
        materials.forEach(material => {
            if (material.suppliers.length > 1) {
                const prices = material.suppliers.map(s => s.unitPrice);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                
                priceAnalysis[material.itemName] = {
                    最低單價: minPrice,
                    最高單價: maxPrice,
                    平均單價: avgPrice.toFixed(2),
                    價差: (maxPrice - minPrice).toFixed(2),
                    價差比例: (((maxPrice - minPrice) / minPrice) * 100).toFixed(2) + '%',
                    供應商數: material.suppliers.length
                };
            }
        });

        return priceAnalysis;
    }

    calculatePriceRange(materials) {
        let allPrices = [];
        
        materials.forEach(material => {
            material.suppliers.forEach(supplier => {
                allPrices.push(supplier.unitPrice);
            });
        });

        if (allPrices.length === 0) return { min: 0, max: 0 };

        return {
            最低單價: Math.min(...allPrices),
            最高單價: Math.max(...allPrices),
            平均單價: (allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length).toFixed(2)
        };
    }

    getUniqueSupplierCount(materials) {
        const suppliers = new Set();
        materials.forEach(material => {
            material.suppliers.forEach(supplier => {
                suppliers.add(supplier.supplierId);
            });
        });
        return suppliers.size;
    }

    categorizeItem(itemName) {
        if (itemName.includes('混凝土') || itemName.includes('水泥')) return '結構材料';
        if (itemName.includes('鋼筋') || itemName.includes('鋼材')) return '鋼材';
        if (itemName.includes('磚') || itemName.includes('瓦')) return '砌體材料';
        if (itemName.includes('電線') || itemName.includes('開關')) return '電氣材料';
        if (itemName.includes('管線') || itemName.includes('閥門')) return '給排水材料';
        if (itemName.includes('門') || itemName.includes('窗')) return '門窗材料';
        if (itemName.includes('油漆') || itemName.includes('塗料')) return '裝修材料';
        return '其他材料';
    }

    generateComparativeReport(projectNames, reportType = 'BOTH') {
        const comparativeReport = {
            報表類型: '專案比較分析報表',
            產生日期: new Date().toLocaleDateString(),
            比較專案: projectNames,
            
            專案概要: {},
            成本比較: {},
            供應商比較: {},
            效率分析: {}
        };

        projectNames.forEach(projectName => {
            const projectPOs = this.getAllPurchaseOrdersByProject(projectName);
            
            comparativeReport.專案概要[projectName] = {
                採購單總數: projectPOs.length,
                總採購金額: projectPOs.reduce((sum, po) => sum + po.totalAmount, 0),
                平均採購金額: projectPOs.length > 0 
                    ? (projectPOs.reduce((sum, po) => sum + po.totalAmount, 0) / projectPOs.length).toFixed(2)
                    : 0,
                參與供應商數: new Set(projectPOs.map(po => po.supplierId)).size
            };
        });

        const costComparison = this.generateCostComparison(projectNames);
        comparativeReport.成本比較 = costComparison;

        return comparativeReport;
    }

    generateCostComparison(projectNames) {
        const comparison = {};
        
        projectNames.forEach(projectName => {
            const projectPOs = this.getAllPurchaseOrdersByProject(projectName);
            const costBreakdown = this.analyzeCostBreakdown(projectPOs);
            
            comparison[projectName] = {
                總成本: costBreakdown.總成本,
                成本效率: this.calculateCostEfficiency(projectPOs),
                成本分布: costBreakdown.成本分布
            };
        });

        return comparison;
    }

    calculateCostEfficiency(purchaseOrders) {
        const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
        const totalItems = purchaseOrders.reduce((sum, po) => sum + po.items.length, 0);
        
        return {
            平均每項成本: totalItems > 0 ? (totalAmount / totalItems).toFixed(2) : 0,
            採購頻率: purchaseOrders.length,
            成本集中度: this.calculateCostConcentration(purchaseOrders)
        };
    }

    calculateCostConcentration(purchaseOrders) {
        const supplierCosts = {};
        let totalCost = 0;

        purchaseOrders.forEach(po => {
            if (!supplierCosts[po.supplierId]) {
                supplierCosts[po.supplierId] = 0;
            }
            supplierCosts[po.supplierId] += po.totalAmount;
            totalCost += po.totalAmount;
        });

        const costs = Object.values(supplierCosts).sort((a, b) => b - a);
        const top3Cost = costs.slice(0, 3).reduce((sum, cost) => sum + cost, 0);
        
        return totalCost > 0 ? ((top3Cost / totalCost) * 100).toFixed(2) + '%' : '0%';
    }

    exportReportToExcel(reportId, format = 'detailed') {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`報表 ${reportId} 不存在`);
        }

        if (format === 'summary') {
            return {
                基本資訊: report.報表基本資訊,
                統計摘要: report.統計摘要
            };
        }

        return report;
    }

    getReport(reportId) {
        return this.reports.get(reportId);
    }

    getAllReports() {
        return Array.from(this.reports.values());
    }

    deleteReport(reportId) {
        return this.reports.delete(reportId);
    }

    getAllPurchaseOrdersByProject(projectName) {
        return [];
    }

    createReportTemplate(templateName, configuration) {
        this.reportTemplates.set(templateName, {
            name: templateName,
            config: configuration,
            createDate: new Date()
        });
        return templateName;
    }

    generateReportFromTemplate(templateName, projectData) {
        const template = this.reportTemplates.get(templateName);
        if (!template) {
            throw new Error(`報表範本 ${templateName} 不存在`);
        }

        const config = template.config;
        if (config.type === 'ENGINEERING') {
            return this.generateEngineeringPurchaseReport(
                projectData.projectName,
                projectData.purchaseOrders,
                config.dateFrom,
                config.dateTo
            );
        } else if (config.type === 'MATERIAL') {
            return this.generateMaterialPurchaseReport(
                projectData.projectName,
                projectData.purchaseOrders,
                config.dateFrom,
                config.dateTo
            );
        }
    }
}

module.exports = ReportService;