const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 獲取所有採購單
router.get('/', auth, async (req, res) => {
  try {
    const purchases = await prisma.purchaseOrder.findMany({
      include: {
        project: { select: { name: true } },
        supplier: { select: { name: true, contactPerson: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    console.error('獲取採購單錯誤:', error);
    res.status(500).json({ error: '獲取採購單失敗' });
  }
});

// 創建新採購單
router.post('/', auth, async (req, res) => {
  try {
    const {
      projectId,
      supplierId,
      orderNumber,
      totalAmount,
      deliveryDate,
      terms,
      items
    } = req.body;

    const purchase = await prisma.purchaseOrder.create({
      data: {
        projectId,
        supplierId,
        orderNumber,
        totalAmount: parseFloat(totalAmount),
        deliveryDate: new Date(deliveryDate),
        terms,
        items: JSON.stringify(items),
        createdById: req.user.userId
      },
      include: {
        project: { select: { name: true } },
        supplier: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    });

    res.status(201).json(purchase);
  } catch (error) {
    console.error('創建採購單錯誤:', error);
    res.status(500).json({ error: '創建採購單失敗' });
  }
});

module.exports = router;