import express from 'express';
import { body, validationResult } from 'express-validator';
import { getSupabase } from '../lib/supabase.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';
import { newId } from '../lib/ids.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

async function recalcProductRating(sb, productId) {
  const { data: rows } = await sb.from('Review').select('rating').eq('productId', productId);
  const list = rows || [];
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  await sb
    .from('Product')
    .update({
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: count,
      updatedAt: nowIso(),
    })
    .eq('id', productId);
}

router.get('/product/:productId', optionalAuth, async (req, res) => {
  const sb = getSupabase();
  const { data: reviews, error } = await sb
    .from('Review')
    .select('*, User(name, avatar)')
    .eq('productId', req.params.productId)
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  const mapped = (reviews || []).map((r) => {
    const row = { ...r, user: r.User };
    delete row.User;
    return toLegacy(row);
  });
  res.json(mapped);
});

router.post(
  '/',
  protect,
  [
    body('product').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { product, rating, comment } = req.body;
    const sb = getSupabase();
    const { data: prod } = await sb.from('Product').select('id').eq('id', product).maybeSingle();
    if (!prod) return res.status(404).json({ message: 'Product not found' });

    const id = newId();
    const ts = nowIso();
    const { data: review, error } = await sb
      .from('Review')
      .insert({
        id,
        productId: product,
        userId: req.user._id,
        rating: Number(rating),
        comment: comment || '',
        updatedAt: ts,
      })
      .select('*, User(name, avatar)')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ message: 'You already reviewed this product' });
      return res.status(400).json({ message: error.message });
    }
    await recalcProductRating(sb, product);
    const row = { ...review, user: review.User };
    delete row.User;
    res.status(201).json(toLegacy(row));
  }
);

router.delete('/:id', protect, async (req, res) => {
  const sb = getSupabase();
  const { data: review } = await sb.from('Review').select('*').eq('id', req.params.id).maybeSingle();
  if (!review) return res.status(404).json({ message: 'Not found' });
  if (review.userId !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const pid = review.productId;
  await sb.from('Review').delete().eq('id', review.id);
  await recalcProductRating(sb, pid);
  res.json({ ok: true });
});

export default router;
