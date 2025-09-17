const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 獲取項目進度更新
router.get('/:projectId', auth, async (req, res) => {
  try {
    const progressUpdates = await prisma.progressUpdate.findMany({
      where: { projectId: req.params.projectId },
      include: {
        updatedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(progressUpdates);
  } catch (error) {
    console.error('獲取進度更新錯誤:', error);
    res.status(500).json({ error: '獲取進度更新失敗' });
  }
});

// 創建進度更新
router.post('/', auth, async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      progressPercentage,
      status,
      images
    } = req.body;

    const progressUpdate = await prisma.progressUpdate.create({
      data: {
        projectId,
        title,
        description,
        progressPercentage: parseInt(progressPercentage),
        status,
        images: images ? JSON.stringify(images) : null,
        updatedById: req.user.userId
      },
      include: {
        updatedBy: { select: { name: true } }
      }
    });

    res.status(201).json(progressUpdate);
  } catch (error) {
    console.error('創建進度更新錯誤:', error);
    res.status(500).json({ error: '創建進度更新失敗' });
  }
});

module.exports = router;