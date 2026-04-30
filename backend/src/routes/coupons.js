import express from 'express';
import { Coupon } from '../models/Coupon.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post('/validate', protect, async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });
  const c = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
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
  const list = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.json(list);
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
    const doc = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });
    res.status(201).json(doc);
  }
);

router.patch('/:id', protect, allowRoles('admin'), async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json(c);
});

router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
