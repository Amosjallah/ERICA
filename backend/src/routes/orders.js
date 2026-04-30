import express from 'express';
import { Order } from '../models/Order.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';

const router = express.Router();

router.get('/my', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json(orders);
});

router.get('/number/:orderNumber', protect, async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .populate('user', 'name email')
    .lean();
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(order);
});

router.get('/vendor', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor not found' });
  const orders = await Order.find({ 'subOrders.vendor': req.vendorProfile._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .lean();
  res.json(orders);
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

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'paid' && order.status !== 'processing' && order.status !== 'shipped') {
      return res.status(400).json({ message: 'Order cannot be updated' });
    }

    const sub = order.subOrders.find(
      (s) => s.vendor.toString() === req.vendorProfile._id.toString()
    );
    if (!sub) return res.status(404).json({ message: 'Sub-order not found' });
    sub.status = status;
    if (order.status === 'paid' && status === 'processing') order.status = 'processing';
    if (status === 'shipped') order.status = 'shipped';
    if (status === 'delivered') {
      const allDelivered = order.subOrders.every((s) => s.status === 'delivered' || s.status === 'cancelled');
      if (allDelivered) order.status = 'delivered';
    }
    if (status === 'cancelled') {
      const allCancelled = order.subOrders.every((s) => s.status === 'cancelled');
      if (allCancelled) order.status = 'cancelled';
    }
    await order.save();
    res.json(order);
  }
);

export default router;
