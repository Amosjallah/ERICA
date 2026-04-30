import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

async function recalcProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const avg = Number(agg._avg.rating ?? 0);
  const count = agg._count._all ?? 0;
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: count,
    },
  });
}

router.get('/product/:productId', optionalAuth, async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews.map((r) => toLegacy(r)));
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
    const prod = await prisma.product.findUnique({ where: { id: product } });
    if (!prod) return res.status(404).json({ message: 'Product not found' });

    try {
      const review = await prisma.review.create({
        data: {
          productId: product,
          userId: req.user._id,
          rating: Number(rating),
          comment: comment || '',
        },
        include: { user: { select: { name: true, avatar: true } } },
      });
      await recalcProductRating(product);
      res.status(201).json(toLegacy(review));
    } catch (e) {
      if (e.code === 'P2002') return res.status(400).json({ message: 'You already reviewed this product' });
      throw e;
    }
  }
);

router.delete('/:id', protect, async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ message: 'Not found' });
  if (review.userId !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const pid = review.productId;
  await prisma.review.delete({ where: { id: review.id } });
  await recalcProductRating(pid);
  res.json({ ok: true });
});

export default router;
