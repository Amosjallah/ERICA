import express from 'express';
import prisma from '../lib/prisma.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.use(protect);

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

async function cartPayload(cartId, filterApproved = false) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId } });
  const rows = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: {
        include: { vendor: { select: { storeName: true, slug: true, approvalStatus: true } } },
      },
    },
  });
  let rowsFiltered = rows;
  if (filterApproved) {
    rowsFiltered = rows.filter((i) => i.product?.vendor?.approvalStatus === 'approved');
  }
  const items = rowsFiltered.map((i) => ({
    product: toLegacy(i.product),
    quantity: i.quantity,
  }));
  return { _id: cart.id, user: cart.userId, items };
}

router.get('/', async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const payload = await cartPayload(cart.id, true);
  res.json(payload);
});

router.post('/items', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ message: 'Invalid product' });

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { vendor: true },
  });
  if (!product?.active) return res.status(404).json({ message: 'Product not found' });
  if (product.vendor.approvalStatus !== 'approved')
    return res.status(400).json({ message: 'Vendor not available' });
  const qty = Math.max(1, Number(quantity));
  if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await getOrCreateCart(req.user._id);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    const nextQty = existing.quantity + qty;
    if (product.stock < nextQty) return res.status(400).json({ message: 'Insufficient stock' });
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: qty },
    });
  }

  res.json(await cartPayload(cart.id, false));
});

router.patch('/items/:productId', async (req, res) => {
  const { quantity } = req.body;
  const pid = req.params.productId;
  const qty = Math.max(1, Number(quantity));

  const product = await prisma.product.findUnique({ where: { id: pid } });
  if (!product?.active) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

  const cart = await getOrCreateCart(req.user._id);
  const line = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: pid } },
  });
  if (!line) return res.status(404).json({ message: 'Item not in cart' });
  await prisma.cartItem.update({ where: { id: line.id }, data: { quantity: qty } });

  res.json(await cartPayload(cart.id, false));
});

router.delete('/items/:productId', async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId: req.params.productId },
  });
  res.json(await cartPayload(cart.id, false));
});

router.delete('/', async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.json(await cartPayload(cart.id, false));
});

export default router;
