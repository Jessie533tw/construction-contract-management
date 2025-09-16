const InquiryService = require('./services/inquiryService');
const ComparisonService = require('./services/comparisonService');
const PurchaseOrderService = require('./services/purchaseOrderService');
const ScheduleService = require('./services/scheduleService');
const ReportService = require('./services/reportService');
const { Supplier } = require('./models/dataModels');

class ContractManagementApp {
    constructor() {
        this.inquiryService = new InquiryService();
        this.comparisonService = new ComparisonService();
        this.purchaseOrderService = new PurchaseOrderService();
        this.scheduleService = new ScheduleService();
        this.reportService = new ReportService();
        
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadDashboard();
        this.loadSampleData();
    }

    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
            this.setupForms();
            this.setupButtons();
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        const sections = document.querySelectorAll('.section-container');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                link.classList.add('active');
                const sectionId = link.dataset.section + '-section';
                const targetSection = document.getElementById(sectionId);
                
                if (targetSection) {
                    targetSection.classList.add('active');
                    this.updatePageTitle(link.textContent);
                    this.loadSectionData(link.dataset.section);
                }
            });
        });
    }

    setupForms() {
        const newInquiryForm = document.getElementById('newInquiryForm');
        if (newInquiryForm) {
            newInquiryForm.addEventListener('submit', (e) => this.handleNewInquiry(e));
        }

        const newSupplierForm = document.getElementById('newSupplierForm');
        if (newSupplierForm) {
            newSupplierForm.addEventListener('submit', (e) => this.handleNewSupplier(e));
        }

        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addInquiryItem());
        }
    }

    setupButtons() {
        const generateComparisonBtn = document.getElementById('generate-comparison-btn');
        if (generateComparisonBtn) {
            generateComparisonBtn.addEventListener('click', () => this.generateComparison());
        }

        const generateReportBtn = document.getElementById('generate-report-btn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }

        const refreshScheduleBtn = document.getElementById('refresh-schedule-btn');
        if (refreshScheduleBtn) {
            refreshScheduleBtn.addEventListener('click', () => this.refreshSchedule());
        }
    }

    updatePageTitle(title) {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = title.trim();
        }
    }

    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'inquiry':
                this.loadInquiries();
                break;
            case 'comparison':
                this.loadComparisonOptions();
                break;
            case 'purchase':
                this.loadPurchaseOrders();
                break;
            case 'schedule':
                this.loadScheduleOptions();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'suppliers':
                this.loadSuppliers();
                break;
        }
    }

    loadDashboard() {
        const inquiries = this.inquiryService.getAllInquiries();
        const purchaseOrders = this.purchaseOrderService.getAllPurchaseOrders();
        
        document.getElementById('total-inquiries').textContent = inquiries.length;
        document.getElementById('total-pos').textContent = purchaseOrders.length;
        document.getElementById('pending-deliveries').textContent = 
            purchaseOrders.filter(po => po.status === 'CONFIRMED' && !po.actualDeliveryDate).length;
        
        const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
        document.getElementById('total-amount').textContent = (totalAmount / 1000000).toFixed(1) + 'M';

        this.loadRecentActivities();
        this.loadPendingTasks();
    }

    loadRecentActivities() {
        const activities = [
            { type: 'inquiry', message: '新建詢價單 INQ000001 - 辦公大樓專案', time: '2小時前' },
            { type: 'quote', message: '收到廠商報價 - 鋼筋混凝土', time: '3小時前' },
            { type: 'po', message: '採購單 PO000001 已確認', time: '5小時前' },
            { type: 'delivery', message: '材料已送達工地 - 水泥', time: '1天前' }
        ];

        const container = document.getElementById('recent-activities');
        if (container) {
            container.innerHTML = activities.map(activity => `
                <div class="d-flex align-items-center mb-2">
                    <div class="me-3">
                        <i class="fas fa-${this.getActivityIcon(activity.type)} text-muted"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold">${activity.message}</div>
                        <small class="text-muted">${activity.time}</small>
                    </div>
                </div>
            `).join('');
        }
    }

    loadPendingTasks() {
        const tasks = [
            '3個詢價單等待發送',
            '2個報價單待審核',
            '1個採購單待確認',
            '5個項目即將到期'
        ];

        const container = document.getElementById('pending-tasks');
        if (container) {
            container.innerHTML = tasks.map(task => `
                <div class="alert alert-warning alert-sm py-2 mb-2">${task}</div>
            `).join('');
        }
    }

    getActivityIcon(type) {
        const icons = {
            inquiry: 'file-alt',
            quote: 'quote-left',
            po: 'shopping-cart',
            delivery: 'truck'
        };
        return icons[type] || 'info-circle';
    }

    loadInquiries() {
        const inquiries = this.inquiryService.getAllInquiries();
        const tbody = document.querySelector('#inquiry-table tbody');
        
        if (tbody) {
            tbody.innerHTML = inquiries.map(inquiry => `
                <tr>
                    <td>${inquiry.inquiryId}</td>
                    <td>${inquiry.projectName}</td>
                    <td>${inquiry.createDate.toLocaleDateString()}</td>
                    <td>${inquiry.expectedOrderDate.toLocaleDateString()}</td>
                    <td><span class="badge status-badge bg-${this.getStatusColor(inquiry.status)}">${this.getStatusText(inquiry.status)}</span></td>
                    <td>${inquiry.items.length}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-action" onclick="app.viewInquiry('${inquiry.inquiryId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success btn-action" onclick="app.sendInquiry('${inquiry.inquiryId}')">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-action" onclick="app.deleteInquiry('${inquiry.inquiryId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadPurchaseOrders() {
        const purchaseOrders = this.purchaseOrderService.getAllPurchaseOrders();
        const tbody = document.querySelector('#purchase-table tbody');
        
        if (tbody) {
            tbody.innerHTML = purchaseOrders.map(po => `
                <tr>
                    <td>${po.poId}</td>
                    <td>${po.projectName}</td>
                    <td>${po.supplierId}</td>
                    <td>${po.createDate.toLocaleDateString()}</td>
                    <td>$${po.totalAmount.toLocaleString()}</td>
                    <td><span class="badge status-badge bg-${this.getStatusColor(po.status)}">${this.getStatusText(po.status)}</span></td>
                    <td>${po.expectedDeliveryDate ? po.expectedDeliveryDate.toLocaleDateString() : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-action" onclick="app.viewPurchaseOrder('${po.poId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-action" onclick="app.editPurchaseOrder('${po.poId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    loadSuppliers() {
        const suppliers = this.inquiryService.getAllSuppliers();
        const tbody = document.querySelector('#suppliers-table tbody');
        
        if (tbody) {
            tbody.innerHTML = suppliers.map(supplier => `
                <tr>
                    <td>${supplier.supplierId}</td>
                    <td>${supplier.companyName}</td>
                    <td>${supplier.contactPerson}</td>
                    <td>${supplier.phone}</td>
                    <td>${supplier.email}</td>
                    <td>${supplier.cooperationHistory.length}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-action" onclick="app.viewSupplier('${supplier.supplierId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning btn-action" onclick="app.editSupplier('${supplier.supplierId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }

    getStatusColor(status) {
        const colors = {
            'DRAFT': 'secondary',
            'SENT': 'info',
            'COMPLETED': 'success',
            'CREATED': 'warning',
            'CONFIRMED': 'success',
            'PENDING': 'warning',
            'DELIVERED': 'success'
        };
        return colors[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'DRAFT': '草稿',
            'SENT': '已發送',
            'COMPLETED': '已完成',
            'CREATED': '已建立',
            'CONFIRMED': '已確認',
            'PENDING': '待處理',
            'DELIVERED': '已交貨'
        };
        return texts[status] || status;
    }

    handleNewInquiry(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const inquiry = this.inquiryService.createInquiry(
                formData.get('projectName'),
                formData.get('projectCode'),
                formData.get('expectedOrderDate')
            );
            
            const itemElements = document.querySelectorAll('.inquiry-item');
            itemElements.forEach(itemElement => {
                const itemData = {
                    itemId: itemElement.querySelector('[name="itemId"]').value,
                    itemName: itemElement.querySelector('[name="itemName"]').value,
                    specification: itemElement.querySelector('[name="specification"]').value,
                    unit: itemElement.querySelector('[name="unit"]').value,
                    quantity: parseInt(itemElement.querySelector('[name="quantity"]').value),
                    estimatedUnitPrice: parseFloat(itemElement.querySelector('[name="estimatedUnitPrice"]').value)
                };
                
                this.inquiryService.addItemToInquiry(inquiry.inquiryId, itemData);
            });
            
            this.showAlert('詢價單建立成功！', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('newInquiryModal'));
            modal.hide();
            this.loadInquiries();
            
        } catch (error) {
            this.showAlert('建立詢價單失敗：' + error.message, 'danger');
        }
    }

    handleNewSupplier(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const supplier = new Supplier(
            formData.get('supplierId'),
            formData.get('companyName'),
            formData.get('contactPerson'),
            formData.get('phone'),
            formData.get('email'),
            formData.get('address')
        );
        
        try {
            this.inquiryService.registerSupplier(supplier);
            this.showAlert('供應商新增成功！', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('newSupplierModal'));
            modal.hide();
            this.loadSuppliers();
        } catch (error) {
            this.showAlert('新增供應商失敗：' + error.message, 'danger');
        }
    }

    addInquiryItem() {
        const container = document.getElementById('inquiry-items');
        const itemHtml = `
            <div class="inquiry-item border rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">採購項目</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.inquiry-item').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-2">
                        <label class="form-label">項目編號</label>
                        <input type="text" class="form-control" name="itemId" required>
                    </div>
                    <div class="col-md-8 mb-2">
                        <label class="form-label">項目名稱</label>
                        <input type="text" class="form-control" name="itemName" required>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-2">
                        <label class="form-label">規格</label>
                        <input type="text" class="form-control" name="specification" required>
                    </div>
                    <div class="col-md-2 mb-2">
                        <label class="form-label">單位</label>
                        <input type="text" class="form-control" name="unit" required>
                    </div>
                    <div class="col-md-2 mb-2">
                        <label class="form-label">數量</label>
                        <input type="number" class="form-control" name="quantity" required>
                    </div>
                    <div class="col-md-2 mb-2">
                        <label class="form-label">預估單價</label>
                        <input type="number" class="form-control" name="estimatedUnitPrice" step="0.01">
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    }

    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('.main-content');
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    loadSampleData() {
        const sampleSuppliers = [
            new Supplier('SUP001', '建材大廠股份有限公司', '王經理', '02-1234-5678', 'wang@buildmat.com', '台北市信義區'),
            new Supplier('SUP002', '鋼鐵工業有限公司', '李主任', '02-2345-6789', 'li@steel.com', '新北市板橋區'),
            new Supplier('SUP003', '混凝土供應商', '陳總監', '02-3456-7890', 'chen@concrete.com', '桃園市中壢區')
        ];
        
        sampleSuppliers.forEach(supplier => {
            this.inquiryService.registerSupplier(supplier);
        });

        this.purchaseOrderService.setBudgetModule('辦公大樓專案', 50000000, 5000000);
        this.purchaseOrderService.setBudgetModule('住宅大樓專案', 30000000, 2000000);
    }

    sendInquiry(inquiryId) {
        try {
            this.inquiryService.sendInquiry(inquiryId);
            this.showAlert('詢價單已發送！', 'success');
            this.loadInquiries();
        } catch (error) {
            this.showAlert('發送詢價單失敗：' + error.message, 'danger');
        }
    }

    viewInquiry(inquiryId) {
        const inquiry = this.inquiryService.getInquiry(inquiryId);
        if (inquiry) {
            console.log('查看詢價單：', inquiry);
        }
    }

    viewPurchaseOrder(poId) {
        const po = this.purchaseOrderService.getPurchaseOrder(poId);
        if (po) {
            console.log('查看採購單：', po);
        }
    }

    viewSupplier(supplierId) {
        const supplier = this.inquiryService.getSupplier(supplierId);
        if (supplier) {
            console.log('查看供應商：', supplier);
        }
    }
}

let app;
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new ContractManagementApp();
        window.app = app;
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractManagementApp;
}