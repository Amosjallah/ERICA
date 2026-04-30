import express from 'express';
import prisma from '../lib/prisma.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';
import { formatOrderResponse } from '../utils/orderFormat.js';
import { toLegacy } from '../utils/legacy.js';
import { slugify } from '../utils/slugify.js';

const router = express.Router();

router.get('/stores', async (_req, res) => {
  const vendors = await prisma.vendor.findMany({
    where: { approvalStatus: 'approved' },
    orderBy: { storeName: 'asc' },
    select: {
      id: true,
      storeName: true,
      slug: true,
      logo: true,
      description: true,
      banner: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
  res.json(vendors.map((v) => toLegacy(v)));
});

router.get('/store/:slug', async (req, res) => {
  const vendor = await prisma.vendor.findFirst({
    where: { slug: req.params.slug, approvalStatus: 'approved' },
    include: { user: { select: { name: true } } },
  });
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id, active: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ vendor: toLegacy(vendor), products: products.map((p) => toLegacy(p)) });
});

router.get('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  res.json(req.vendorProfile);
});

router.patch('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });
  const { storeName, description } = req.body;
  const data = {};
  if (storeName) {
    data.storeName = storeName.trim();
    data.slug = `${slugify(storeName.trim())}-${req.vendorProfile._id.slice(-6)}`;
  }
  if (description !== undefined) data.description = description;
  const v = await prisma.vendor.update({
    where: { id: req.vendorProfile._id },
    data,
  });
  res.json(toLegacy(v));
});

router.get('/dashboard/summary', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(404).json({ message: 'Vendor not found' });

  const productCount = await prisma.product.count({ where: { vendorId: v._id } });
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['paid', 'processing', 'shipped', 'delivered'] },
      suborders: { some: { vendorId: v._id } },
    },
    include: { suborders: true },
  });

  let revenue = 0;
  let orderCount = 0;
  for (const o of orders) {
    for (const sub of o.suborders || []) {
      if (sub.vendorId === v._id) {
        orderCount += 1;
        revenue += sub.vendorPayoutTotal || 0;
      }
    }
  }

  const recentOrders = await prisma.order.findMany({
    where: { suborders: { some: { vendorId: v._id } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: { select: { name: true, email: true } },
      suborders: { include: { lines: true } },
    },
  });

  res.json({
    productCount,
    orderCount,
    revenue: Math.round(revenue * 100) / 100,
    approvalStatus: v.approvalStatus,
    recentOrders: recentOrders.map((o) => formatOrderResponse(o)),
  });
});

export default router;
