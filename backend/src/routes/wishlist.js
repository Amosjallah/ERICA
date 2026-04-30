import express from 'express';
import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

async function getOrCreate(userId) {
  let w = await Wishlist.findOne({ user: userId });
  if (!w) w = await Wishlist.create({ user: userId, products: [] });
  return w;
}

router.get('/', async (req, res) => {
  const w = await getOrCreate(req.user._id);
  await w.populate({ path: 'products', populate: { path: 'vendor', select: 'storeName slug' } });
  res.json(w);
});

router.post('/:productId', async (req, res) => {
  const p = await Product.findById(req.params.productId);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  const w = await getOrCreate(req.user._id);
  if (!w.products.map((id) => id.toString()).includes(p._id.toString())) {
    w.products.push(p._id);
    await w.save();
  }
  await w.populate('products');
  res.json(w);
});

router.delete('/:productId', async (req, res) => {
  const w = await getOrCreate(req.user._id);
  w.products = w.products.filter((id) => id.toString() !== req.params.productId);
  await w.save();
  await w.populate('products');
  res.json(w);
});

export default router;
