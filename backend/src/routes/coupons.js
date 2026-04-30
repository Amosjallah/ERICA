import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { toLegacy } from '../utils/legacy.js';
import { newId } from '../lib/ids.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

router.post('/validate', protect, async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });
  const sb = getSupabase();
  const { data: c } = await sb.from('Coupon').select('*').eq('code', code.trim().toUpperCase()).eq('active', true).maybeSingle();
  if (!c) return res.status(400).json({ message: 'Invalid coupon' });
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return res.status(400).json({ message: 'Expired' });
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
  const sb = getSupabase();
  const { data: list, error } = await sb.from('Coupon').select('*').order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json((list || []).map((c) => toLegacy(c)));
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
    const sb = getSupabase();
    const ts = nowIso();
    const { data: doc, error } = await sb
      .from('Coupon')
      .insert({
        id: newId(),
        code: req.body.code.toUpperCase(),
        description: req.body.description ?? '',
        discountType: req.body.discountType,
        discountValue: Number(req.body.discountValue),
        maxUses: req.body.maxUses != null ? Number(req.body.maxUses) : null,
        minOrderAmount: req.body.minOrderAmount != null ? Number(req.body.minOrderAmount) : 0,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt).toISOString() : null,
        active: req.body.active !== false,
        updatedAt: ts,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(toLegacy(doc));
  }
);

router.patch('/:id', protect, allowRoles('admin'), async (req, res) => {
  const sb = getSupabase();
  const payload = { updatedAt: nowIso() };
  const allowed = ['code', 'description', 'discountType', 'discountValue', 'maxUses', 'minOrderAmount', 'expiresAt', 'active'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      if (k === 'code') payload[k] = String(req.body[k]).toUpperCase();
      else if (k === 'discountValue' || k === 'maxUses' || k === 'minOrderAmount') payload[k] = req.body[k] == null ? null : Number(req.body[k]);
      else if (k === 'expiresAt') payload[k] = req.body[k] ? new Date(req.body[k]).toISOString() : null;
      else payload[k] = req.body[k];
    }
  }
  const { data: c, error } = await sb.from('Coupon').update(payload).eq('id', req.params.id).select('*').maybeSingle();
  if (error || !c) return res.status(404).json({ message: 'Not found' });
  res.json(toLegacy(c));
});

router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  const sb = getSupabase();
  const { error } = await sb.from('Coupon').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

export default router;
