const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 獲取所有供應商
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        quotations: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('獲取供應商錯誤:', error);
    res.status(500).json({ error: '獲取供應商失敗' });
  }
});

// 創建新供應商
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      businessType,
      rating
    } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        businessType,
        rating: rating ? parseFloat(rating) : null
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('創建供應商錯誤:', error);
    res.status(500).json({ error: '創建供應商失敗' });
  }
});

// 更新供應商
router.put('/:id', auth, async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(supplier);
  } catch (error) {
    console.error('更新供應商錯誤:', error);
    res.status(500).json({ error: '更新供應商失敗' });
  }
});

module.exports = router;