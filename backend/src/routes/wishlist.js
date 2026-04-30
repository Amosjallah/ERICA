import express from 'express';
import prisma from '../lib/prisma.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';

const router = express.Router();

router.use(protect);

async function getOrCreateWishlist(userId) {
  let w = await prisma.wishlist.findUnique({ where: { userId } });
  if (!w) w = await prisma.wishlist.create({ data: { userId } });
  return w;
}

router.get('/', async (req, res) => {
  const w = await getOrCreateWishlist(req.user._id);
  const links = await prisma.wishlistProduct.findMany({
    where: { wishlistId: w.id },
    include: {
      product: { include: { vendor: { select: { storeName: true, slug: true } } } },
    },
  });
  const products = links.map((l) => l.product).filter(Boolean);
  res.json(toLegacy({ ...w, products }));
});

router.post('/:productId', async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.productId } });
  if (!p) return res.status(404).json({ message: 'Product not found' });
  const w = await getOrCreateWishlist(req.user._id);
  await prisma.wishlistProduct.upsert({
    where: {
      wishlistId_productId: { wishlistId: w.id, productId: p.id },
    },
    create: { wishlistId: w.id, productId: p.id },
    update: {},
  });
  const links = await prisma.wishlistProduct.findMany({
    where: { wishlistId: w.id },
    include: { product: true },
  });
  res.json(toLegacy({ ...w, products: links.map((l) => l.product) }));
});

router.delete('/:productId', async (req, res) => {
  const w = await getOrCreateWishlist(req.user._id);
  await prisma.wishlistProduct.deleteMany({
    where: { wishlistId: w.id, productId: req.params.productId },
  });
  const links = await prisma.wishlistProduct.findMany({
    where: { wishlistId: w.id },
    include: { product: true },
  });
  res.json(toLegacy({ ...w, products: links.map((l) => l.product) }));
});

export default router;
