import express from 'express';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Notification } from '../models/Notification.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, allowRoles('admin'));

router.get('/analytics', async (_req, res) => {
  const [users, vendors, products, orders, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Product.countDocuments({ active: true }),
    Order.countDocuments({ status: { $ne: 'pending_payment' } }),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' }, commissions: { $sum: 0 } } },
    ]),
  ]);

  let commissionTotal = 0;
  const paidOrders = await Order.find({
    status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
  }).lean();
  for (const o of paidOrders) {
    for (const s of o.subOrders || []) {
      commissionTotal += s.commissionTotal || 0;
    }
  }

  const gross = revenueAgg[0]?.total || 0;

  res.json({
    users,
    vendors,
    products,
    orders,
    grossRevenue: Math.round(gross * 100) / 100,
    platformCommission: Math.round(commissionTotal * 100) / 100,
  });
});

router.get('/pending-vendors', async (_req, res) => {
  const list = await Vendor.find({ approvalStatus: 'pending' })
    .populate('user', 'name email createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json(list);
});

router.patch('/vendors/:id', async (req, res) => {
  const { approvalStatus, rejectionReason, commissionOverridePercent } = req.body;
  const v = await Vendor.findById(req.params.id);
  if (!v) return res.status(404).json({ message: 'Not found' });

  if (approvalStatus === 'approved') {
    v.approvalStatus = 'approved';
    v.approvedAt = new Date();
    v.rejectionReason = '';
    await Notification.create({
      user: v.user,
      title: 'Vendor approved',
      body: `${v.storeName} is live on Ericah Marketplace.`,
      type: 'vendor',
    });
  } else if (approvalStatus === 'rejected') {
    v.approvalStatus = 'rejected';
    v.rejectionReason = rejectionReason || '';
    await Notification.create({
      user: v.user,
      title: 'Vendor application update',
      body: rejectionReason || 'Your application needs updates.',
      type: 'vendor',
    });
  }
  if (commissionOverridePercent != null) {
    v.commissionOverridePercent = Number(commissionOverridePercent);
  }
  await v.save();
  res.json(v);
});

router.get('/users', async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(200).lean();
  res.json(users);
});

router.patch('/users/:id', async (req, res) => {
  const updates = {};
  if (req.body.role && ['customer', 'vendor', 'admin'].includes(req.body.role)) {
    updates.role = req.body.role;
  }
  if (req.body.name) updates.name = req.body.name;
  const u = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!u) return res.status(404).json({ message: 'Not found' });
  res.json(u);
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get('/orders', async (_req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'name email')
    .lean();
  res.json(orders);
});

router.get('/products', async (_req, res) => {
  const products = await Product.find()
    .populate('vendor', 'storeName slug')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(products);
});

router.delete('/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.delete('/categories/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
