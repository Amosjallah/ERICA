import express from 'express';
import prisma from '../lib/prisma.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.post('/validate', protect, async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });
  const c = await prisma.coupon.findFirst({
    where: { code: code.trim().toUpperCase(), active: true },
  });
  if (!c) return res.status(400).json({ message: 'Invalid coupon' });
  if (c.expiresAt && c.expiresAt < new Date()) return res.status(400).json({ message: 'Expired' });
  const sub = Number(subtotal) || 0;
  if (c.minOrderAmount && sub < c.minOrderAmount) {
    return res.status(400).json({ message: `Minimum order ${c.minOrderAmount}` });
  }
  if (c.maxUses != null && c.usesCount >= c.maxUses) return res.status(400).json({ message: 'Sold out' });

  let discount = 0;
  if (c.discountType === 'percent') discount = (sub * c.discountValue) / 100;
  else discount = c.discountValue;
  discount = Math.min(discount, sub);
  res.json({ discount, code: c.code, description: c.description });
});

router.get('/', protect, allowRoles('admin'), async (_req, res) => {
  const list = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list.map((c) => toLegacy(c)));
});

router.post(
  '/',
  protect,
  allowRoles('admin'),
  [
    body('code').notEmpty().trim(),
    body('discountType').isIn(['percent', 'fixed']),
    body('discountValue').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const doc = await prisma.coupon.create({
      data: {
        code: req.body.code.toUpperCase(),
        description: req.body.description ?? '',
        discountType: req.body.discountType,
        discountValue: Number(req.body.discountValue),
        maxUses: req.body.maxUses != null ? Number(req.body.maxUses) : null,
        minOrderAmount: req.body.minOrderAmount != null ? Number(req.body.minOrderAmount) : 0,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        active: req.body.active !== false,
      },
    });
    res.status(201).json(toLegacy(doc));
  }
);

router.patch('/:id', protect, allowRoles('admin'), async (req, res) => {
  try {
    const c = await prisma.coupon.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(toLegacy(c));
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

export default router;
