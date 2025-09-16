const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '無訪問權限，請提供有效token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: '用戶不存在或已停用' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token無效' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未經授權的訪問' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '權限不足' });
    }

    next();
  };
};

module.exports = { auth, authorize };