const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始種子數據初始化...');

  // 創建預設管理員用戶
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@construction.com' },
    update: {},
    create: {
      email: 'admin@construction.com',
      username: 'admin',
      password: hashedPassword,
      name: '系統管理員',
      role: 'ADMIN',
      department: 'IT部門',
      phone: '02-1234-5678',
      isActive: true,
    },
  });

  console.log('✅ 創建管理員用戶:', adminUser.email);

  // 創建預設專案經理
  const managerPassword = await bcrypt.hash('manager123', 10);

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@construction.com' },
    update: {},
    create: {
      email: 'manager@construction.com',
      username: 'manager',
      password: managerPassword,
      name: '專案經理',
      role: 'MANAGER',
      department: '工程部',
      phone: '02-1234-5679',
      isActive: true,
    },
  });

  console.log('✅ 創建專案經理用戶:', managerUser.email);

  // 創建預設供應商
  const supplier1 = await prisma.supplier.upsert({
    where: { code: 'SUP001' },
    update: {},
    create: {
      code: 'SUP001',
      name: '大安建材有限公司',
      contactName: '張先生',
      email: 'contact@daan-materials.com',
      phone: '02-2345-6789',
      address: '台北市大安區復興南路一段100號',
      taxId: '12345678',
      rating: 5,
      notes: '品質優良，交期準時',
      isActive: true,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { code: 'SUP002' },
    update: {},
    create: {
      code: 'SUP002',
      name: '信義鋼鐵股份有限公司',
      contactName: '李小姐',
      email: 'sales@xinyi-steel.com',
      phone: '02-3456-7890',
      address: '台北市信義區松高路50號',
      taxId: '87654321',
      rating: 4,
      notes: '鋼材品質穩定',
      isActive: true,
    },
  });

  console.log('✅ 創建供應商:', supplier1.name, supplier2.name);

  console.log('🎉 種子數據初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 種子數據初始化失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });