const { Inquiry, ProjectItem } = require('../models/dataModels');

class InquiryService {
    constructor() {
        this.inquiries = new Map();
        this.suppliers = new Map();
        this.currentInquiryId = 1;
    }

    createInquiry(projectName, projectCode, expectedOrderDate) {
        const inquiryId = `INQ${String(this.currentInquiryId).padStart(6, '0')}`;
        const inquiry = new Inquiry(inquiryId, projectName, projectCode, expectedOrderDate);
        
        this.inquiries.set(inquiryId, inquiry);
        this.currentInquiryId++;
        
        return inquiry;
    }

    addItemToInquiry(inquiryId, itemData) {
        const inquiry = this.inquiries.get(inquiryId);
        if (!inquiry) {
            throw new Error(`詢價單 ${inquiryId} 不存在`);
        }

        const item = new ProjectItem(
            itemData.itemId,
            itemData.itemName,
            itemData.specification,
            itemData.unit,
            itemData.quantity,
            itemData.estimatedUnitPrice
        );

        inquiry.addItem(item);
        return item;
    }

    addSuppliersToInquiry(inquiryId, supplierIds) {
        const inquiry = this.inquiries.get(inquiryId);
        if (!inquiry) {
            throw new Error(`詢價單 ${inquiryId} 不存在`);
        }

        supplierIds.forEach(supplierId => {
            const supplier = this.suppliers.get(supplierId);
            if (supplier) {
                inquiry.addTargetSupplier(supplier);
            }
        });

        return inquiry.targetSuppliers;
    }

    sendInquiry(inquiryId) {
        const inquiry = this.inquiries.get(inquiryId);
        if (!inquiry) {
            throw new Error(`詢價單 ${inquiryId} 不存在`);
        }

        if (inquiry.items.length === 0) {
            throw new Error('詢價單必須包含至少一個項目');
        }

        if (inquiry.targetSuppliers.length === 0) {
            throw new Error('詢價單必須指定至少一家廠商');
        }

        inquiry.sendToSuppliers();
        
        console.log(`詢價單 ${inquiryId} 已發送給 ${inquiry.targetSuppliers.length} 家廠商`);
        return inquiry;
    }

    getInquiry(inquiryId) {
        return this.inquiries.get(inquiryId);
    }

    getAllInquiries() {
        return Array.from(this.inquiries.values());
    }

    getInquiriesByStatus(status) {
        return Array.from(this.inquiries.values()).filter(inquiry => inquiry.status === status);
    }

    updateInquiryStatus(inquiryId, status) {
        const inquiry = this.inquiries.get(inquiryId);
        if (!inquiry) {
            throw new Error(`詢價單 ${inquiryId} 不存在`);
        }

        inquiry.status = status;
        return inquiry;
    }

    exportInquiryToExcel(inquiryId) {
        const inquiry = this.inquiries.get(inquiryId);
        if (!inquiry) {
            throw new Error(`詢價單 ${inquiryId} 不存在`);
        }

        const exportData = {
            inquiryInfo: {
                詢價單號: inquiry.inquiryId,
                專案名稱: inquiry.projectName,
                專案編號: inquiry.projectCode,
                建立日期: inquiry.createDate.toLocaleDateString(),
                預計下單日期: inquiry.expectedOrderDate.toLocaleDateString(),
                狀態: inquiry.status
            },
            items: inquiry.items.map(item => ({
                項目編號: item.itemId,
                項目名稱: item.itemName,
                規格: item.specification,
                單位: item.unit,
                數量: item.quantity,
                預估單價: item.estimatedUnitPrice,
                預估總價: item.estimatedTotalPrice
            })),
            suppliers: inquiry.targetSuppliers.map(supplier => ({
                廠商編號: supplier.supplierId,
                公司名稱: supplier.companyName,
                聯絡人: supplier.contactPerson,
                電話: supplier.phone,
                信箱: supplier.email
            }))
        };

        return exportData;
    }

    generateInquiryReport() {
        const inquiries = Array.from(this.inquiries.values());
        const report = {
            總詢價單數: inquiries.length,
            待發送: inquiries.filter(i => i.status === 'DRAFT').length,
            已發送: inquiries.filter(i => i.status === 'SENT').length,
            已完成: inquiries.filter(i => i.status === 'COMPLETED').length,
            詳細列表: inquiries.map(inquiry => ({
                詢價單號: inquiry.inquiryId,
                專案名稱: inquiry.projectName,
                建立日期: inquiry.createDate.toLocaleDateString(),
                項目數量: inquiry.items.length,
                廠商數量: inquiry.targetSuppliers.length,
                狀態: inquiry.status
            }))
        };

        return report;
    }

    registerSupplier(supplierData) {
        this.suppliers.set(supplierData.supplierId, supplierData);
        return supplierData;
    }

    getSupplier(supplierId) {
        return this.suppliers.get(supplierId);
    }

    getAllSuppliers() {
        return Array.from(this.suppliers.values());
    }

    searchInquiries(searchCriteria) {
        const inquiries = Array.from(this.inquiries.values());
        
        return inquiries.filter(inquiry => {
            let matches = true;

            if (searchCriteria.projectName) {
                matches = matches && inquiry.projectName.includes(searchCriteria.projectName);
            }

            if (searchCriteria.status) {
                matches = matches && inquiry.status === searchCriteria.status;
            }

            if (searchCriteria.dateFrom) {
                matches = matches && inquiry.createDate >= new Date(searchCriteria.dateFrom);
            }

            if (searchCriteria.dateTo) {
                matches = matches && inquiry.createDate <= new Date(searchCriteria.dateTo);
            }

            return matches;
        });
    }
}

module.exports = InquiryService;