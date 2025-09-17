const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 獲取所有報價單
router.get('/', auth, async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        inquiry: {
          include: {
            project: { select: { name: true } }
          }
        },
        supplier: { select: { name: true, contactPerson: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(quotations);
  } catch (error) {
    console.error('獲取報價單錯誤:', error);
    res.status(500).json({ error: '獲取報價單失敗' });
  }
});

// 創建新報價單
router.post('/', auth, async (req, res) => {
  try {
    const {
      inquiryId,
      supplierId,
      totalPrice,
      validUntil,
      notes,
      items
    } = req.body;

    const quotation = await prisma.quotation.create({
      data: {
        inquiryId,
        supplierId,
        totalPrice: parseFloat(totalPrice),
        validUntil: new Date(validUntil),
        notes,
        items: JSON.stringify(items)
      },
      include: {
        supplier: { select: { name: true } },
        inquiry: {
          include: {
            project: { select: { name: true } }
          }
        }
      }
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error('創建報價單錯誤:', error);
    res.status(500).json({ error: '創建報價單失敗' });
  }
});

module.exports = router;