// 瀏覽器版本的發包管理系統應用程式

// 簡化的資料模型類別
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

// 主要應用程式類別
class ContractManagementApp {
    constructor() {
        this.suppliers = new Map();
        this.inquiries = new Map();
        this.purchaseOrders = new Map();
        
        this.currentInquiryId = 1;
        this.currentPOId = 1;
        
        this.init();
    }

    init() {
        this.loadSampleData();
        this.initEventListeners();
        this.loadDashboard();
    }

    loadSampleData() {
        // 載入樣本供應商資料
        const sampleSuppliers = [
            new Supplier('SUP001', '建材大廠股份有限公司', '王經理', '02-1234-5678', 'wang@buildmat.com', '台北市信義區'),
            new Supplier('SUP002', '鋼鐵工業有限公司', '李主任', '02-2345-6789', 'li@steel.com', '新北市板橋區'),
            new Supplier('SUP003', '混凝土供應商', '陳總監', '02-3456-7890', 'chen@concrete.com', '桃園市中壢區')
        ];
        
        sampleSuppliers.forEach(supplier => {
            this.suppliers.set(supplier.supplierId, supplier);
        });

        // 建立樣本詢價單
        this.createSampleInquiry();
        
        console.log('✅ 樣本資料載入完成');
    }

    createSampleInquiry() {
        const inquiry = new Inquiry('INQ000001', '辦公大樓專案', 'PROJ001', '2024-03-15');
        
        const items = [
            new ProjectItem('ITEM001', '鋼筋混凝土', 'C240', 'm3', 100, 3500),
            new ProjectItem('ITEM002', '鋼筋', '#4', 'ton', 50, 28000),
            new ProjectItem('ITEM003', '模板', '18mm夾板', 'm2', 200, 120)
        ];
        
        items.forEach(item => inquiry.addItem(item));
        
        Array.from(this.suppliers.values()).forEach(supplier => {
            inquiry.addTargetSupplier(supplier);
        });
        
        inquiry.sendToSuppliers();
        this.inquiries.set(inquiry.inquiryId, inquiry);

        // 建立樣本採購單
        const po = new PurchaseOrder('PO000001', 'INQ000001', 'SUP001', '辦公大樓專案');
        po.addItem('ITEM001', '鋼筋混凝土', 'C240', 'm3', 100, 3400);
        po.addItem('ITEM002', '鋼筋', '#4', 'ton', 50, 27500);
        po.addItem('ITEM003', '模板', '18mm夾板', 'm2', 200, 115);
        po.confirm();
        
        this.purchaseOrders.set(po.poId, po);
    }

    initEventListeners() {
        // 導航選單
        this.setupNavigation();
        
        // 表單處理
        this.setupForms();
        
        // 按鈕事件
        this.setupButtons();
        
        console.log('✅ 事件監聽器設定完成');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        const sections = document.querySelectorAll('.section-container');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有active狀態
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // 設定新的active狀態
                link.classList.add('active');
                const sectionId = link.dataset.section + '-section';
                const targetSection = document.getElementById(sectionId);
                
                if (targetSection) {
                    targetSection.classList.add('active');
                    this.updatePageTitle(link.textContent.trim());
                    this.loadSectionData(link.dataset.section);
                }
            });
        });
    }

    setupForms() {
        // 新詢價單表單
        const newInquiryForm = document.getElementById('newInquiryForm');
        if (newInquiryForm) {
            newInquiryForm.addEventListener('submit', (e) => this.handleNewInquiry(e));
        }

        // 新供應商表單
        const newSupplierForm = document.getElementById('newSupplierForm');
        if (newSupplierForm) {
            newSupplierForm.addEventListener('submit', (e) => this.handleNewSupplier(e));
        }

        // 新增項目按鈕
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addInquiryItem());
        }
    }

    setupButtons() {
        // 各種按鈕事件處理
        const buttons = {
            'generate-comparison-btn': () => this.generateComparison(),
            'generate-report-btn': () => this.generateReport(),
            'refresh-schedule-btn': () => this.refreshSchedule(),
            'new-purchase-btn': () => this.showNewPurchaseModal()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    updatePageTitle(title) {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = title;
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
        // 更新統計數字
        const inquiries = Array.from(this.inquiries.values());
        const purchaseOrders = Array.from(this.purchaseOrders.values());
        
        this.updateElement('total-inquiries', inquiries.length);
        this.updateElement('total-pos', purchaseOrders.length);
        this.updateElement('pending-deliveries', purchaseOrders.filter(po => po.status === 'CONFIRMED').length);
        
        const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
        this.updateElement('total-amount', (totalAmount / 1000000).toFixed(1) + 'M');

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

    loadInquiries() {
        const inquiries = Array.from(this.inquiries.values());
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
        const purchaseOrders = Array.from(this.purchaseOrders.values());
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
        const suppliers = Array.from(this.suppliers.values());
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

    loadComparisonOptions() {
        const select = document.getElementById('comparison-inquiry-select');
        if (select) {
            const inquiries = Array.from(this.inquiries.values()).filter(i => i.status === 'SENT');
            select.innerHTML = '<option value="">選擇詢價單...</option>' + 
                inquiries.map(i => `<option value="${i.inquiryId}">${i.inquiryId} - ${i.projectName}</option>`).join('');
        }
    }

    loadScheduleOptions() {
        const select = document.getElementById('schedule-project-select');
        if (select) {
            const projects = [...new Set(Array.from(this.inquiries.values()).map(i => i.projectName))];
            select.innerHTML = '<option value="">選擇專案...</option>' + 
                projects.map(p => `<option value="${p}">${p}</option>`).join('');
        }
    }

    loadReports() {
        const container = document.getElementById('reports-content');
        if (container) {
            container.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5>報表功能</h5>
                        <p>選擇報表類型並點擊生成報表按鈕來查看詳細的採購分析。</p>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <i class="fas fa-chart-line fa-3x text-primary mb-3"></i>
                                        <h6>工程採購明細表</h6>
                                        <p class="small text-muted">以工程進度或分項工程為主軸的採購分析</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <i class="fas fa-boxes fa-3x text-success mb-3"></i>
                                        <h6>工料採購明細表</h6>
                                        <p class="small text-muted">以材料、工項為主軸的採購分析</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    handleNewInquiry(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const inquiryId = `INQ${String(this.currentInquiryId).padStart(6, '0')}`;
            const inquiry = new Inquiry(
                inquiryId,
                formData.get('projectName'),
                formData.get('projectCode'),
                formData.get('expectedOrderDate')
            );
            
            // 處理項目
            const itemElements = document.querySelectorAll('.inquiry-item');
            itemElements.forEach(itemElement => {
                const itemData = new ProjectItem(
                    itemElement.querySelector('[name="itemId"]').value,
                    itemElement.querySelector('[name="itemName"]').value,
                    itemElement.querySelector('[name="specification"]').value,
                    itemElement.querySelector('[name="unit"]').value,
                    parseInt(itemElement.querySelector('[name="quantity"]').value),
                    parseFloat(itemElement.querySelector('[name="estimatedUnitPrice"]').value)
                );
                inquiry.addItem(itemData);
            });
            
            this.inquiries.set(inquiryId, inquiry);
            this.currentInquiryId++;
            
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
            this.suppliers.set(supplier.supplierId, supplier);
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

    // 輔助方法
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
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

    showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999;" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                if (alert.textContent.includes(message)) {
                    alert.remove();
                }
            });
        }, 3000);
    }

    // 按鈕處理方法
    generateComparison() {
        this.showAlert('比較表功能展示 - 實際使用時會顯示詳細的廠商報價比較', 'info');
    }

    generateReport() {
        this.showAlert('報表生成功能展示 - 實際使用時會產生詳細的採購分析報表', 'info');
    }

    refreshSchedule() {
        this.showAlert('進度表已刷新', 'success');
    }

    showNewPurchaseModal() {
        this.showAlert('採購單建立功能 - 實際使用時會開啟採購單建立表單', 'info');
    }

    // 查看功能
    viewInquiry(inquiryId) {
        const inquiry = this.inquiries.get(inquiryId);
        if (inquiry) {
            this.showAlert(`查看詢價單 ${inquiryId} - ${inquiry.projectName}`, 'info');
        }
    }

    viewPurchaseOrder(poId) {
        const po = this.purchaseOrders.get(poId);
        if (po) {
            this.showAlert(`查看採購單 ${poId} - ${po.projectName}`, 'info');
        }
    }

    viewSupplier(supplierId) {
        const supplier = this.suppliers.get(supplierId);
        if (supplier) {
            this.showAlert(`查看供應商 ${supplierId} - ${supplier.companyName}`, 'info');
        }
    }

    sendInquiry(inquiryId) {
        const inquiry = this.inquiries.get(inquiryId);
        if (inquiry) {
            inquiry.sendToSuppliers();
            this.showAlert(`詢價單 ${inquiryId} 已發送！`, 'success');
            this.loadInquiries();
        }
    }

    deleteInquiry(inquiryId) {
        if (confirm('確定要刪除這個詢價單嗎？')) {
            this.inquiries.delete(inquiryId);
            this.showAlert('詢價單已刪除', 'success');
            this.loadInquiries();
        }
    }
}

// 當頁面載入完成時初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ContractManagementApp();
    console.log('🎉 建設公司發包管理系統已啟動！');
});