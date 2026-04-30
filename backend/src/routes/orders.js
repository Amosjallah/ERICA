import express from 'express';
import prisma from '../lib/prisma.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';
import { formatOrderResponse } from '../utils/orderFormat.js';

const router = express.Router();

router.get('/my', protect, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user._id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      suborders: { include: { lines: true } },
    },
  });
  res.json(orders.map((o) => formatOrderResponse(o)));
});

router.get('/number/:orderNumber', protect, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: {
      user: { select: { name: true, email: true } },
      suborders: { include: { lines: true } },
    },
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (order.userId !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(formatOrderResponse(order));
});

router.get('/vendor', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor not found' });
  const orders = await prisma.order.findMany({
    where: { suborders: { some: { vendorId: req.vendorProfile._id } } },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      suborders: { include: { lines: true } },
    },
  });
  res.json(orders.map((o) => formatOrderResponse(o)));
});

router.patch(
  '/:orderId/suborder',
  protect,
  allowRoles('vendor'),
  loadVendor,
  async (req, res) => {
    if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor not found' });
    const { status } = req.body;
    const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { suborders: true },
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['paid', 'processing', 'shipped'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be updated' });
    }

    const sub = order.suborders.find((s) => s.vendorId === req.vendorProfile._id);
    if (!sub) return res.status(404).json({ message: 'Sub-order not found' });

    await prisma.orderSuborder.update({
      where: { id: sub.id },
      data: { status },
    });

    let newOrderStatus = order.status;
    if (order.status === 'paid' && status === 'processing') newOrderStatus = 'processing';
    if (status === 'shipped') newOrderStatus = 'shipped';
    if (status === 'delivered') {
      const refreshed = await prisma.orderSuborder.findMany({ where: { orderId: order.id } });
      const allDone = refreshed.every((s) => s.status === 'delivered' || s.status === 'cancelled');
      if (allDone) newOrderStatus = 'delivered';
    }
    if (status === 'cancelled') {
      const refreshed = await prisma.orderSuborder.findMany({ where: { orderId: order.id } });
      const allCancelled = refreshed.every((s) => s.status === 'cancelled');
      if (allCancelled) newOrderStatus = 'cancelled';
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: newOrderStatus },
    });

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: { select: { name: true, email: true } },
        suborders: { include: { lines: true } },
      },
    });
    res.json(formatOrderResponse(updated));
  }
);

export default router;
