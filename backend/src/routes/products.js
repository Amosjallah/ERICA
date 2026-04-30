import express from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Vendor } from '../models/Vendor.js';
import { optionalAuth, protect, allowRoles } from '../middleware/auth.js';
import { loadVendor, requireApprovedVendor } from '../middleware/vendor.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  const {
    q,
    category,
    vendor,
    minPrice,
    maxPrice,
    featured,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { active: true };
  if (category) {
    const cat = await Category.findOne({
      $or: [{ slug: category }, { _id: mongoose.isValidObjectId(category) ? category : null }],
    });
    if (cat) filter.category = cat._id;
  }
  if (vendor) {
    const vdoc = await Vendor.findOne({
      $or: [{ slug: vendor }, { _id: mongoose.isValidObjectId(vendor) ? vendor : null }],
    });
    if (vdoc) filter.vendor = vdoc._id;
  }
  if (featured === 'true') filter.featured = true;
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }
  if (q?.trim()) {
    filter.$text = { $search: q.trim() };
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.min(48, Math.max(1, Number(limit)));
  const lim = Math.min(48, Math.max(1, Number(limit)));

  let sortObj = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { price: 1 };
  if (sort === 'price_desc') sortObj = { price: -1 };
  if (sort === 'rating') sortObj = { averageRating: -1, reviewCount: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('vendor', 'storeName slug logo approvalStatus')
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(lim)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const filtered = items.filter((p) => p.vendor?.approvalStatus === 'approved');
  res.json({
    products: filtered,
    pagination: { total, page: Number(page), limit: lim, pages: Math.ceil(total / lim) },
  });
});

router.get('/by-id/:id', optionalAuth, async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('vendor', 'storeName slug logo description banner approvalStatus')
    .populate('category', 'name slug')
    .lean();
  if (!product || product.vendor?.approvalStatus !== 'approved') {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

router.get('/:vendorSlug/:productSlug', optionalAuth, async (req, res) => {
  const vendor = await Vendor.findOne({ slug: req.params.vendorSlug, approvalStatus: 'approved' });
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  const product = await Product.findOne({
    vendor: vendor._id,
    slug: req.params.productSlug,
    active: true,
  })
    .populate('vendor', 'storeName slug logo description banner')
    .populate('category', 'name slug')
    .lean();

  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

router.post(
  '/',
  protect,
  allowRoles('vendor'),
  loadVendor,
  requireApprovedVendor,
  upload.array('images', 8),
  async (req, res) => {
    const v = req.vendorProfile;
    const { title, description, price, compareAtPrice, stock, category, sku, featured } = req.body;
    if (!title?.trim() || price == null || !category) {
      return res.status(400).json({ message: 'title, price, category required' });
    }
    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });

    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const product = await Product.create({
      vendor: v._id,
      category: cat._id,
      title: title.trim(),
      description: description || '',
      price: Number(price),
      compareAtPrice: compareAtPrice != null ? Number(compareAtPrice) : undefined,
      stock: Number(stock) || 0,
      sku: sku || '',
      images,
      featured: featured === true || featured === 'true',
    });
    const populated = await Product.findById(product._id)
      .populate('vendor', 'storeName slug')
      .populate('category', 'name slug');
    res.status(201).json(populated);
  }
);

router.patch(
  '/:id',
  protect,
  allowRoles('vendor', 'admin'),
  loadVendor,
  upload.array('images', 8),
  async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'vendor') {
      if (!req.vendorProfile || product.vendor.toString() !== req.vendorProfile._id.toString()) {
        return res.status(403).json({ message: 'Not your product' });
      }
      if (req.vendorProfile.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'Vendor not approved' });
      }
    }

    const body = req.body;
    const updates = {};
    ['title', 'description', 'price', 'compareAtPrice', 'stock', 'sku', 'active', 'featured', 'category'].forEach(
      (k) => {
        if (body[k] !== undefined) updates[k] = body[k];
      }
    );
    if (req.files?.length) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      updates.images = [...(product.images || []), ...newImages].slice(0, 10);
    }

    Object.assign(product, updates);
    await product.save();
    const populated = await Product.findById(product._id)
      .populate('vendor', 'storeName slug')
      .populate('category', 'name slug');
    res.json(populated);
  }
);

router.delete('/:id', protect, allowRoles('vendor', 'admin'), loadVendor, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'vendor') {
    if (!req.vendorProfile || product.vendor.toString() !== req.vendorProfile._id.toString()) {
      return res.status(403).json({ message: 'Not your product' });
    }
  }
  await product.deleteOne();
  res.json({ ok: true });
});

export default router;
