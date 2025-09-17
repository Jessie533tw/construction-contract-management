const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始種子數據初始化...');

  // 清理現有資料（開發環境用）
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 清理開發環境資料...');
    await prisma.progressUpdate.deleteMany();
    await prisma.progressItem.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.quotationItem.deleteMany();
    await prisma.quotation.deleteMany();
    await prisma.inquiryItem.deleteMany();
    await prisma.inquiry.deleteMany();
    await prisma.budgetItem.deleteMany();
    await prisma.project.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();
  }

  // === 創建用戶資料 ===
  console.log('👥 創建用戶資料...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@construction.com',
      username: 'admin',
      password: adminPassword,
      name: '系統管理員',
      role: 'ADMIN',
      department: 'IT部門',
      phone: '02-1234-5678',
      isActive: true,
    }
  });

  const managerPassword = await bcrypt.hash('manager123', 10);
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@construction.com',
      username: 'manager',
      password: managerPassword,
      name: '王專案經理',
      role: 'MANAGER',
      department: '工程部',
      phone: '02-1234-5679',
      isActive: true,
    }
  });

  const userPassword = await bcrypt.hash('user123', 10);
  const normalUser = await prisma.user.create({
    data: {
      email: 'user@construction.com',
      username: 'user',
      password: userPassword,
      name: '李採購專員',
      role: 'USER',
      department: '採購部',
      phone: '02-1234-5680',
      isActive: true,
    }
  });

  console.log('✅ 創建用戶完成:', [adminUser.name, managerUser.name, normalUser.name].join(', '));

  // === 創建供應商資料 ===
  console.log('🏢 創建供應商資料...');

  const supplier1 = await prisma.supplier.create({
    data: {
      code: 'SUP001',
      name: '大安建材有限公司',
      contactName: '張經理',
      email: 'contact@daan-materials.com',
      phone: '02-2345-6789',
      address: '台北市大安區復興南路一段100號',
      taxId: '12345678',
      rating: 5,
      notes: '建築材料供應商，品質優良',
      isActive: true,
    }
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      code: 'SUP002',
      name: '信義鋼鐵股份有限公司',
      contactName: '李小姐',
      email: 'sales@xinyi-steel.com',
      phone: '02-3456-7890',
      address: '台北市信義區松高路50號',
      taxId: '87654321',
      rating: 4,
      notes: '鋼鐵材料供應商，交期準時',
      isActive: true,
    }
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      code: 'SUP003',
      name: '中山電機工程行',
      contactName: '陳師傅',
      email: 'info@zhongshan-electric.com',
      phone: '02-4567-8901',
      address: '台北市中山區中山北路二段200號',
      taxId: '11223344',
      rating: 4,
      notes: '電機工程專業廠商',
      isActive: true,
    }
  });

  console.log('✅ 創建供應商完成:', [supplier1.name, supplier2.name, supplier3.name].join(', '));

  // === 創建項目資料 ===
  console.log('🏗️ 創建項目資料...');

  const project1 = await prisma.project.create({
    data: {
      projectNumber: 'PRJ-2024-001',
      name: '信義區商辦大樓建案',
      description: '位於信義區的30層商辦大樓建設計畫，包含地下3層停車場',
      location: '台北市信義區松仁路100號',
      budget: 2500000000, // 25億
      startDate: new Date('2024-01-15'),
      endDate: new Date('2026-12-31'),
      status: 'PLANNING',
      contractNumber: 'CT-2024-001',
      createdById: adminUser.id,
      managerId: managerUser.id,
    }
  });

  const project2 = await prisma.project.create({
    data: {
      projectNumber: 'PRJ-2024-002',
      name: '大安區住宅社區建案',
      description: '大安區高級住宅社區，共5棟15層建築',
      location: '台北市大安區復興南路二段300號',
      budget: 1800000000, // 18億
      startDate: new Date('2024-03-01'),
      endDate: new Date('2026-08-31'),
      status: 'IN_PROGRESS',
      contractNumber: 'CT-2024-002',
      createdById: adminUser.id,
      managerId: managerUser.id,
    }
  });

  const project3 = await prisma.project.create({
    data: {
      projectNumber: 'PRJ-2024-003',
      name: '中山區辦公室裝修工程',
      description: '中山區既有辦公大樓內部裝修改建工程',
      location: '台北市中山區南京東路三段50號',
      budget: 50000000, // 5千萬
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-09-30'),
      status: 'IN_PROGRESS',
      contractNumber: 'CT-2024-003',
      createdById: managerUser.id,
      managerId: normalUser.id,
    }
  });

  console.log('✅ 創建項目完成:', [project1.name, project2.name, project3.name].join(', '));

  // === 創建預算項目 ===
  console.log('💰 創建預算項目...');

  const budgetItem1 = await prisma.budgetItem.create({
    data: {
      projectId: project1.id,
      category: '主結構',
      itemName: 'H型鋼',
      description: 'H400x200x8x13 結構用鋼材',
      quantity: 500,
      unit: '噸',
      unitPrice: 120000,
      totalPrice: 60000000,
    }
  });

  const budgetItem2 = await prisma.budgetItem.create({
    data: {
      projectId: project2.id,
      category: '基礎工程',
      itemName: '高強度混凝土',
      description: 'fc=420 高強度混凝土',
      quantity: 2000,
      unit: '立方米',
      unitPrice: 8000,
      totalPrice: 16000000,
    }
  });

  console.log('✅ 創建預算項目完成');

  // === 創建詢價單資料 ===
  console.log('📝 創建詢價單資料...');

  const inquiry1 = await prisma.inquiry.create({
    data: {
      inquiryNumber: 'INQ-2024-001',
      projectId: project1.id,
      title: '信義大樓主結構鋼材詢價',
      description: '30層商辦大樓主結構用H型鋼、角鋼等材料詢價',
      dueDate: new Date('2024-02-15'),
      status: 'SENT',
      createdById: managerUser.id,
      sentAt: new Date('2024-01-20'),
    }
  });

  const inquiry2 = await prisma.inquiry.create({
    data: {
      inquiryNumber: 'INQ-2024-002',
      projectId: project2.id,
      title: '大安社區基礎工程材料詢價',
      description: '住宅社區地基工程所需水泥、砂石等材料',
      dueDate: new Date('2024-03-20'),
      status: 'RESPONDED',
      createdById: managerUser.id,
      sentAt: new Date('2024-03-01'),
    }
  });

  console.log('✅ 創建詢價單完成:', [inquiry1.title, inquiry2.title].join(', '));

  // === 創建詢價項目 ===
  console.log('📋 創建詢價項目...');

  const inquiryItem1 = await prisma.inquiryItem.create({
    data: {
      inquiryId: inquiry1.id,
      budgetItemId: budgetItem1.id,
      itemName: 'H型鋼 H400x200x8x13',
      description: '主結構用H型鋼材',
      quantity: 500,
      unit: '噸',
      specifications: 'CNS 2947 規範',
    }
  });

  const inquiryItem2 = await prisma.inquiryItem.create({
    data: {
      inquiryId: inquiry2.id,
      budgetItemId: budgetItem2.id,
      itemName: '高強度混凝土',
      description: 'fc=420 高強度混凝土',
      quantity: 2000,
      unit: '立方米',
      specifications: 'CNS 3090 規範',
    }
  });

  console.log('✅ 創建詢價項目完成');

  // === 創建報價單資料 ===
  console.log('💰 創建報價單資料...');

  const quotation1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-2024-001',
      inquiryId: inquiry1.id,
      supplierId: supplier2.id,
      validUntil: new Date('2024-03-01'),
      totalAmount: 85000000,
      status: 'UNDER_REVIEW',
      notes: '品質保證，可配合工期需求',
      receivedAt: new Date('2024-01-25'),
    }
  });

  const quotation2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QUO-2024-002',
      inquiryId: inquiry2.id,
      supplierId: supplier1.id,
      validUntil: new Date('2024-04-15'),
      totalAmount: 45000000,
      status: 'SELECTED',
      notes: '本地供應商，運輸成本低',
      receivedAt: new Date('2024-03-05'),
    }
  });

  console.log('✅ 創建報價單完成');

  // === 創建報價項目 ===
  console.log('📊 創建報價項目...');

  await prisma.quotationItem.create({
    data: {
      quotationId: quotation1.id,
      inquiryItemId: inquiryItem1.id,
      unitPrice: 170000,
      totalPrice: 85000000,
      deliveryDays: 30,
      notes: '分批交貨，配合工程進度',
    }
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotation2.id,
      inquiryItemId: inquiryItem2.id,
      unitPrice: 22500,
      totalPrice: 45000000,
      deliveryDays: 7,
      notes: '現場澆築，提供技術支援',
    }
  });

  console.log('✅ 創建報價項目完成');

  // === 創建採購單資料 ===
  console.log('🛒 創建採購單資料...');

  const purchase1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2024-001',
      projectId: project2.id,
      supplierId: supplier1.id,
      quotationId: quotation2.id,
      totalAmount: 45000000,
      status: 'APPROVED',
      paymentTerms: '貨到付款，7天內付清',
      deliveryDate: new Date('2024-04-01'),
      notes: '優先供應項目，請確保品質',
      createdById: managerUser.id,
      approvedAt: new Date('2024-03-10'),
    }
  });

  console.log('✅ 創建採購單完成:', purchase1.poNumber);

  // === 創建採購項目 ===
  console.log('📦 創建採購項目...');

  await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: purchase1.id,
      itemName: '高強度混凝土',
      description: 'fc=420 高強度混凝土，現場澆築',
      quantity: 2000,
      unit: '立方米',
      unitPrice: 22500,
      totalPrice: 45000000,
    }
  });

  console.log('✅ 創建採購項目完成');

  // === 創建進度項目 ===
  console.log('📈 創建進度項目...');

  const progressItem1 = await prisma.progressItem.create({
    data: {
      projectId: project1.id,
      taskName: '基礎工程',
      description: '地下3層基礎工程施作',
      category: 'CONSTRUCTION',
      plannedStartDate: new Date('2024-01-15'),
      plannedEndDate: new Date('2024-06-30'),
      actualStartDate: new Date('2024-01-18'),
      progressPercent: 15,
      status: 'IN_PROGRESS',
    }
  });

  const progressItem2 = await prisma.progressItem.create({
    data: {
      projectId: project2.id,
      purchaseOrderId: purchase1.id,
      taskName: '基礎混凝土澆築',
      description: '住宅社區基礎混凝土澆築工程',
      category: 'MATERIAL',
      plannedStartDate: new Date('2024-03-15'),
      plannedEndDate: new Date('2024-04-30'),
      actualStartDate: new Date('2024-03-18'),
      progressPercent: 45,
      status: 'IN_PROGRESS',
    }
  });

  console.log('✅ 創建進度項目完成');

  // === 創建進度更新資料 ===
  console.log('📊 創建進度更新資料...');

  await prisma.progressUpdate.create({
    data: {
      progressItemId: progressItem1.id,
      progressPercent: 15,
      status: 'IN_PROGRESS',
      notes: '基礎工程按計畫進行，土方開挖已完成',
      photos: ['foundation_progress_1.jpg'],
      updatedById: managerUser.id,
    }
  });

  await prisma.progressUpdate.create({
    data: {
      progressItemId: progressItem2.id,
      progressPercent: 45,
      status: 'IN_PROGRESS',
      notes: 'A棟基礎混凝土澆築完成，養護期中',
      photos: ['concrete_pour_1.jpg', 'concrete_pour_2.jpg'],
      updatedById: managerUser.id,
    }
  });

  console.log('✅ 創建進度更新完成');

  console.log('🎉 種子數據初始化完成！');

  // 顯示登入資訊
  console.log('\n📋 預設登入帳號:');
  console.log('管理員 - admin@construction.com / admin123');
  console.log('專案經理 - manager@construction.com / manager123');
  console.log('一般用戶 - user@construction.com / user123');

  console.log('\n📊 創建的示範資料:');
  console.log(`• ${project1.name} - 預算: ${(project1.budget / 100000000).toFixed(1)}億元`);
  console.log(`• ${project2.name} - 預算: ${(project2.budget / 100000000).toFixed(1)}億元`);
  console.log(`• ${project3.name} - 預算: ${(project3.budget / 10000000).toFixed(0)}千萬元`);
  console.log(`• 供應商: ${supplier1.name}, ${supplier2.name}, ${supplier3.name}`);
  console.log(`• 詢價單: ${inquiry1.inquiryNumber}, ${inquiry2.inquiryNumber}`);
  console.log(`• 採購單: ${purchase1.poNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ 種子數據初始化失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });