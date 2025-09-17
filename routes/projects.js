const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 獲取所有項目
router.get('/', auth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        createdBy: { select: { name: true } },
        manager: { select: { name: true } },
        inquiries: true,
        purchaseOrders: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('獲取項目錯誤:', error);
    res.status(500).json({ error: '獲取項目失敗' });
  }
});

// 創建新項目
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      budget,
      startDate,
      endDate,
      managerId
    } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        location,
        budget: parseFloat(budget),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById: req.user.userId,
        managerId
      },
      include: {
        createdBy: { select: { name: true } },
        manager: { select: { name: true } }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('創建項目錯誤:', error);
    res.status(500).json({ error: '創建項目失敗' });
  }
});

// 獲取單個項目
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true } },
        manager: { select: { name: true } },
        inquiries: {
          include: {
            quotations: true
          }
        },
        purchaseOrders: true,
        progressUpdates: {
          include: {
            updatedBy: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: '項目不存在' });
    }

    res.json(project);
  } catch (error) {
    console.error('獲取項目詳情錯誤:', error);
    res.status(500).json({ error: '獲取項目詳情失敗' });
  }
});

module.exports = router;