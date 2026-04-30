import express from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

router.get('/', async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate({
    path: 'items.product',
    populate: { path: 'vendor', select: 'storeName slug approvalStatus' },
  });
  const items = (cart.items || []).filter(
    (i) => i.product && i.product.vendor?.approvalStatus === 'approved'
  );
  res.json({ ...cart.toObject(), items });
});

router.post('/items', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Invalid product' });

  const product = await Product.findById(productId).populate('vendor');
  if (!product?.active) return res.status(404).json({ message: 'Product not found' });
  if (product.vendor.approvalStatus !== 'approved')
    return res.status(400).json({ message: 'Vendor not available' });
  const qty = Math.max(1, Number(quantity));
  if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (existing) {
    const nextQty = existing.quantity + qty;
    if (product.stock < nextQty) return res.status(400).json({ message: 'Insufficient stock' });
    existing.quantity = nextQty;
  } else {
    cart.items.push({ product: productId, quantity: qty });
  }
  await cart.save();
  await cart.populate({ path: 'items.product', populate: { path: 'vendor', select: 'storeName slug' } });
  res.json(cart);
});

router.patch('/items/:productId', async (req, res) => {
  const { quantity } = req.body;
  const pid = req.params.productId;
  const qty = Math.max(1, Number(quantity));

  const product = await Product.findById(pid);
  if (!product?.active) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await getOrCreateCart(req.user._id);
  const line = cart.items.find((i) => i.product.toString() === pid);
  if (!line) return res.status(404).json({ message: 'Item not in cart' });
  line.quantity = qty;
  await cart.save();
  await cart.populate({ path: 'items.product', populate: { path: 'vendor', select: 'storeName slug' } });
  res.json(cart);
});

router.delete('/items/:productId', async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate({ path: 'items.product', populate: { path: 'vendor', select: 'storeName slug' } });
  res.json(cart);
});

router.delete('/', async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json(cart);
});

export default router;
