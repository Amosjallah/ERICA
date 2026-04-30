import express from 'express';
import prisma from '../lib/prisma.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  const list = await prisma.notification.findMany({
    where: { userId: req.user._id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(list.map((n) => toLegacy(n)));
});

router.patch('/:id/read', async (req, res) => {
  const existing = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user._id },
  });
  if (!existing) return res.status(404).json({ message: 'Not found' });
  const n = await prisma.notification.update({
    where: { id: existing.id },
    data: { read: true },
  });
  res.json(toLegacy(n));
});

router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user._id },
    data: { read: true },
  });
  res.json({ ok: true });
});

export default router;
