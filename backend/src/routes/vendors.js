import express from 'express';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';

const router = express.Router();

router.get('/stores', async (_req, res) => {
  const vendors = await Vendor.find({ approvalStatus: 'approved' })
    .populate('user', 'name')
    .select('storeName slug logo description banner createdAt')
    .sort({ storeName: 1 })
    .lean();
  res.json(vendors);
});

router.get('/store/:slug', async (req, res) => {
  const vendor = await Vendor.findOne({ slug: req.params.slug, approvalStatus: 'approved' })
    .populate('user', 'name')
    .lean();
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  const products = await Product.find({ vendor: vendor._id, active: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ vendor, products });
});

router.get('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  res.json(req.vendorProfile);
});

router.patch('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });
  const { storeName, description } = req.body;
  if (storeName) req.vendorProfile.storeName = storeName.trim();
  if (description !== undefined) req.vendorProfile.description = description;
  await req.vendorProfile.save();
  res.json(req.vendorProfile);
});

router.get('/dashboard/summary', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(404).json({ message: 'Vendor not found' });

  const productCount = await Product.countDocuments({ vendor: v._id });
  const orders = await Order.find({
    'subOrders.vendor': v._id,
    status: { $in: ['paid', 'processing', 'shipped', 'delivered'] },
  }).lean();

  let revenue = 0;
  let orderCount = 0;
  for (const o of orders) {
    for (const sub of o.subOrders || []) {
      if (sub.vendor?.toString() === v._id.toString()) {
        orderCount += 1;
        revenue += sub.vendorPayoutTotal || 0;
      }
    }
  }

  const recentOrders = await Order.find({ 'subOrders.vendor': v._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .lean();

  res.json({
    productCount,
    orderCount,
    revenue: Math.round(revenue * 100) / 100,
    approvalStatus: v.approvalStatus,
    recentOrders,
  });
});

export default router;
