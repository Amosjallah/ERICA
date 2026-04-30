import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { optionalAuth, protect } from '../middleware/auth.js';

const router = express.Router();

async function recalcProductRating(productId) {
  const agg = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avg ?? 0;
  const count = agg[0]?.count ?? 0;
  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

router.get('/product/:productId', optionalAuth, async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();
  res.json(reviews);
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
    const prod = await Product.findById(product);
    if (!prod) return res.status(404).json({ message: 'Product not found' });

    try {
      const review = await Review.create({
        product,
        user: req.user._id,
        rating: Number(rating),
        comment: comment || '',
      });
      await recalcProductRating(product);
      await review.populate('user', 'name avatar');
      res.status(201).json(review);
    } catch (e) {
      if (e.code === 11000) return res.status(400).json({ message: 'You already reviewed this product' });
      throw e;
    }
  }
);

router.delete('/:id', protect, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Not found' });
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const pid = review.product;
  await review.deleteOne();
  await recalcProductRating(pid);
  res.json({ ok: true });
});

export default router;
