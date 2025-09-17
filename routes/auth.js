const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// 用戶登錄
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: '信箱或密碼錯誤' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登錄錯誤:', error);
    res.status(500).json({ error: '登錄失敗' });
  }
});

// 用戶註冊
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, name, role = 'USER', department, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role,
        department,
        phone
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('註冊錯誤:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: '信箱或用戶名已存在' });
    } else {
      res.status(500).json({ error: '註冊失敗' });
    }
  }
});

module.exports = router;