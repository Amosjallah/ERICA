import express from 'express';
import prisma from '../lib/prisma.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';
import { formatOrderResponse } from '../utils/orderFormat.js';

const router = express.Router();
router.use(protect, allowRoles('admin'));

router.get('/analytics', async (_req, res) => {
  const [users, vendors, products, ordersCount] = await Promise.all([
    prisma.user.count(),
    prisma.vendor.count({ where: { approvalStatus: 'approved' } }),
    prisma.product.count({ where: { active: true } }),
    prisma.order.count({
      where: { status: { not: 'pending_payment' } },
    }),
  ]);

  const grossAgg = await prisma.order.aggregate({
    where: { status: { in: ['paid', 'processing', 'shipped', 'delivered'] } },
    _sum: { total: true },
  });

  const paidOrders = await prisma.order.findMany({
    where: { status: { in: ['paid', 'processing', 'shipped', 'delivered'] } },
    include: { suborders: true },
  });

  let commissionTotal = 0;
  for (const o of paidOrders) {
    for (const s of o.suborders || []) {
      commissionTotal += s.commissionTotal || 0;
    }
  }

  const gross = grossAgg._sum.total || 0;

  res.json({
    users,
    vendors,
    products,
    orders: ordersCount,
    grossRevenue: Math.round(Number(gross) * 100) / 100,
    platformCommission: Math.round(commissionTotal * 100) / 100,
  });
});

router.get('/pending-vendors', async (_req, res) => {
  const list = await prisma.vendor.findMany({
    where: { approvalStatus: 'pending' },
    include: { user: { select: { name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list.map((v) => toLegacy(v)));
});

router.patch('/vendors/:id', async (req, res) => {
  const { approvalStatus, rejectionReason, commissionOverridePercent } = req.body;
  const v = await prisma.vendor.findUnique({ where: { id: req.params.id } });
  if (!v) return res.status(404).json({ message: 'Not found' });

  const data = {};
  if (approvalStatus === 'approved') {
    data.approvalStatus = 'approved';
    data.approvedAt = new Date();
    data.rejectionReason = '';
    await prisma.notification.create({
      data: {
        userId: v.userId,
        title: 'Vendor approved',
        body: `${v.storeName} is live on Ericah Marketplace.`,
        type: 'vendor',
      },
    });
  } else if (approvalStatus === 'rejected') {
    data.approvalStatus = 'rejected';
    data.rejectionReason = rejectionReason || '';
    await prisma.notification.create({
      data: {
        userId: v.userId,
        title: 'Vendor application update',
        body: rejectionReason || 'Your application needs updates.',
        type: 'vendor',
      },
    });
  }
  if (commissionOverridePercent != null) {
    data.commissionOverridePercent = Number(commissionOverridePercent);
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const updated = await prisma.vendor.update({
    where: { id: req.params.id },
    data,
  });
  res.json(toLegacy(updated));
});

router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(users.map((u) => toLegacy(u)));
});

router.patch('/users/:id', async (req, res) => {
  const updates = {};
  if (req.body.role && ['customer', 'vendor', 'admin'].includes(req.body.role)) {
    updates.role = req.body.role;
  }
  if (req.body.name) updates.name = req.body.name;
  try {
    const u = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });
    res.json(toLegacy(u));
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

router.get('/orders', async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      suborders: { include: { lines: true } },
    },
  });
  res.json(orders.map((o) => formatOrderResponse(o)));
});

router.get('/products', async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      vendor: { select: { storeName: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(products.map((p) => toLegacy(p)));
});

router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

export default router;
