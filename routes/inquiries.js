const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 獲取所有詢價單
router.get('/', auth, async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      include: {
        project: { select: { name: true } },
        createdBy: { select: { name: true } },
        quotations: {
          include: {
            supplier: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inquiries);
  } catch (error) {
    console.error('獲取詢價單錯誤:', error);
    res.status(500).json({ error: '獲取詢價單失敗' });
  }
});

// 創建新詢價單
router.post('/', auth, async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      items,
      deadline
    } = req.body;

    const inquiry = await prisma.inquiry.create({
      data: {
        projectId,
        title,
        description,
        items: JSON.stringify(items),
        deadline: new Date(deadline),
        createdById: req.user.userId
      },
      include: {
        project: { select: { name: true } },
        createdBy: { select: { name: true } }
      }
    });

    res.status(201).json(inquiry);
  } catch (error) {
    console.error('創建詢價單錯誤:', error);
    res.status(500).json({ error: '創建詢價單失敗' });
  }
});

module.exports = router;