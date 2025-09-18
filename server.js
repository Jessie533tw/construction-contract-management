const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const supplierRoutes = require('./routes/suppliers');
const inquiryRoutes = require('./routes/inquiries');
const quotationRoutes = require('./routes/quotations');
const purchaseRoutes = require('./routes/purchases');
const progressRoutes = require('./routes/progress');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/progress', progressRoutes);

// 提供靜態檔案
app.use(express.static(path.join(__dirname)));

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ message: '建設發包管理系統運行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🏗️  建設發包管理系統服務器運行在端口 ${PORT}`);
  console.log(`📊 API 端點: http://localhost:${PORT}/api`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌐 前端開發服務器: http://localhost:3000`);
  }
});