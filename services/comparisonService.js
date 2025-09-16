const { Quote, QuoteItem, ComparisonTable } = require('../models/dataModels');

class ComparisonService {
    constructor() {
        this.quotes = new Map();
        this.comparisonTables = new Map();
        this.currentQuoteId = 1;
    }

    submitQuote(inquiryId, supplierId, quoteData) {
        const quoteId = `QUO${String(this.currentQuoteId).padStart(6, '0')}`;
        const quote = new Quote(quoteId, inquiryId, supplierId, quoteData.quotedDate);
        
        quote.paymentTerms = quoteData.paymentTerms || '';
        quote.validityDays = quoteData.validityDays || 30;

        quoteData.items.forEach(itemData => {
            const quoteItem = new QuoteItem(
                itemData.itemId,
                itemData.unitPrice,
                itemData.totalPrice,
                itemData.deliveryDays,
                itemData.remarks
            );
            quote.addQuoteItem(quoteItem);
        });

        this.quotes.set(quoteId, quote);
        this.currentQuoteId++;

        return quote;
    }

    createComparisonTable(inquiryId, projectName) {
        const comparisonTable = new ComparisonTable(inquiryId, projectName);
        
        const relatedQuotes = Array.from(this.quotes.values())
            .filter(quote => quote.inquiryId === inquiryId);
        
        relatedQuotes.forEach(quote => {
            comparisonTable.addQuote(quote);
        });

        this.comparisonTables.set(inquiryId, comparisonTable);
        return comparisonTable;
    }

    generateDetailedComparison(inquiryId) {
        const comparisonTable = this.comparisonTables.get(inquiryId);
        if (!comparisonTable) {
            throw new Error(`找不到詢價單 ${inquiryId} 的比價表`);
        }

        const comparison = comparisonTable.generateComparison();
        
        const detailedAnalysis = {
            基本資訊: {
                詢價單號: inquiryId,
                專案名稱: comparisonTable.projectName,
                建立日期: comparisonTable.createDate.toLocaleDateString(),
                參與廠商數: comparisonTable.quotes.length
            },
            廠商總覽: {},
            項目比較: {},
            價格分析: this.analyzePricing(comparisonTable.quotes),
            交期分析: this.analyzeDelivery(comparisonTable.quotes),
            建議決標: this.generateRecommendation(comparisonTable.quotes)
        };

        Object.entries(comparison.supplierSummary).forEach(([supplierId, summary]) => {
            detailedAnalysis.廠商總覽[supplierId] = {
                總金額: summary.totalAmount,
                付款條件: summary.paymentTerms,
                平均交期: Math.round(summary.averageDeliveryDays),
                單價競爭力: this.calculateCompetitiveness(supplierId, comparison.itemComparison)
            };
        });

        Object.entries(comparison.itemComparison).forEach(([itemId, suppliers]) => {
            const prices = Object.values(suppliers).map(s => s.unitPrice);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            detailedAnalysis.項目比較[itemId] = {
                廠商報價: suppliers,
                最低單價: minPrice,
                最高單價: maxPrice,
                價差百分比: ((maxPrice - minPrice) / minPrice * 100).toFixed(2) + '%',
                價格合理性: this.evaluatePriceReasonableness(prices)
            };
        });

        return detailedAnalysis;
    }

    analyzePricing(quotes) {
        const totalPrices = quotes.map(quote => quote.totalAmount);
        const avgPrice = totalPrices.reduce((sum, price) => sum + price, 0) / totalPrices.length;
        const minPrice = Math.min(...totalPrices);
        const maxPrice = Math.max(...totalPrices);

        return {
            最低總價: minPrice,
            最高總價: maxPrice,
            平均總價: Math.round(avgPrice),
            價格差距: Math.round(maxPrice - minPrice),
            價格差距百分比: ((maxPrice - minPrice) / minPrice * 100).toFixed(2) + '%'
        };
    }

    analyzeDelivery(quotes) {
        const deliveryDays = [];
        quotes.forEach(quote => {
            quote.items.forEach(item => {
                deliveryDays.push(item.deliveryDays);
            });
        });

        const avgDelivery = deliveryDays.reduce((sum, days) => sum + days, 0) / deliveryDays.length;
        const minDelivery = Math.min(...deliveryDays);
        const maxDelivery = Math.max(...deliveryDays);

        return {
            最短交期: minDelivery,
            最長交期: maxDelivery,
            平均交期: Math.round(avgDelivery),
            交期風險評估: maxDelivery > 30 ? '高風險' : maxDelivery > 14 ? '中風險' : '低風險'
        };
    }

    calculateCompetitiveness(supplierId, itemComparison) {
        let competitiveCount = 0;
        let totalItems = 0;

        Object.values(itemComparison).forEach(suppliers => {
            if (suppliers[supplierId]) {
                totalItems++;
                const prices = Object.values(suppliers).map(s => s.unitPrice);
                const minPrice = Math.min(...prices);
                if (suppliers[supplierId].unitPrice === minPrice) {
                    competitiveCount++;
                }
            }
        });

        return totalItems > 0 ? Math.round((competitiveCount / totalItems) * 100) + '%' : '0%';
    }

    evaluatePriceReasonableness(prices) {
        const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const standardDeviation = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length);
        const coefficientOfVariation = standardDeviation / avg;

        if (coefficientOfVariation < 0.1) return '價格一致性高';
        if (coefficientOfVariation < 0.2) return '價格差異合理';
        if (coefficientOfVariation < 0.3) return '價格差異較大';
        return '價格差異過大，需檢視';
    }

    generateRecommendation(quotes) {
        const analysis = {
            價格最優: null,
            交期最優: null,
            綜合建議: null
        };

        const minTotalPrice = Math.min(...quotes.map(q => q.totalAmount));
        const priceWinner = quotes.find(q => q.totalAmount === minTotalPrice);
        analysis.價格最優 = priceWinner.supplierId;

        let bestDeliveryScore = Infinity;
        let deliveryWinner = null;
        quotes.forEach(quote => {
            const avgDelivery = quote.items.reduce((sum, item) => sum + item.deliveryDays, 0) / quote.items.length;
            if (avgDelivery < bestDeliveryScore) {
                bestDeliveryScore = avgDelivery;
                deliveryWinner = quote;
            }
        });
        analysis.交期最優 = deliveryWinner.supplierId;

        const scores = quotes.map(quote => {
            const priceScore = (1 - (quote.totalAmount - minTotalPrice) / minTotalPrice) * 0.5;
            const avgDelivery = quote.items.reduce((sum, item) => sum + item.deliveryDays, 0) / quote.items.length;
            const deliveryScore = (1 - (avgDelivery - bestDeliveryScore) / bestDeliveryScore) * 0.3;
            const validityScore = quote.validityDays >= 30 ? 0.2 : 0.1;
            
            return {
                supplierId: quote.supplierId,
                totalScore: priceScore + deliveryScore + validityScore
            };
        });

        const bestSupplier = scores.reduce((best, current) => 
            current.totalScore > best.totalScore ? current : best
        );
        
        analysis.綜合建議 = bestSupplier.supplierId;

        return analysis;
    }

    selectSupplier(inquiryId, supplierId, reason) {
        const comparisonTable = this.comparisonTables.get(inquiryId);
        if (!comparisonTable) {
            throw new Error(`找不到詢價單 ${inquiryId} 的比價表`);
        }

        comparisonTable.selectSupplier(supplierId, reason);
        
        console.log(`詢價單 ${inquiryId} 決標給廠商 ${supplierId}`);
        console.log(`決標原因: ${reason}`);
        
        return comparisonTable;
    }

    getComparisonTable(inquiryId) {
        return this.comparisonTables.get(inquiryId);
    }

    exportComparisonToExcel(inquiryId) {
        const analysis = this.generateDetailedComparison(inquiryId);
        
        return {
            基本資訊: analysis.基本資訊,
            廠商比較: Object.entries(analysis.廠商總覽).map(([supplierId, data]) => ({
                廠商編號: supplierId,
                ...data
            })),
            項目明細: Object.entries(analysis.項目比較).map(([itemId, data]) => ({
                項目編號: itemId,
                最低單價: data.最低單價,
                最高單價: data.最高單價,
                價差百分比: data.價差百分比,
                價格合理性: data.價格合理性
            })),
            分析結果: {
                ...analysis.價格分析,
                ...analysis.交期分析,
                建議決標廠商: analysis.建議決標.綜合建議
            }
        };
    }

    getQuotesByInquiry(inquiryId) {
        return Array.from(this.quotes.values()).filter(quote => quote.inquiryId === inquiryId);
    }

    updateQuoteStatus(quoteId, status) {
        const quote = this.quotes.get(quoteId);
        if (quote) {
            quote.status = status;
            return quote;
        }
        throw new Error(`報價單 ${quoteId} 不存在`);
    }
}

module.exports = ComparisonService;