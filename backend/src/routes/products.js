import express from 'express';
import prisma from '../lib/prisma.js';
import { slugify } from '../utils/slugify.js';
import { optionalAuth, protect, allowRoles } from '../middleware/auth.js';
import { loadVendor, requireApprovedVendor } from '../middleware/vendor.js';
import { upload } from '../middleware/upload.js';
import { toLegacy } from '../utils/legacy.js';

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

  const where = {
    active: true,
    vendor: { approvalStatus: 'approved' },
  };

  if (category) {
    const cat = await prisma.category.findFirst({
      where: { OR: [{ slug: String(category) }, { id: String(category) }] },
    });
    if (cat) where.categoryId = cat.id;
  }
  if (vendor) {
    const vdoc = await prisma.vendor.findFirst({
      where: { OR: [{ slug: String(vendor) }, { id: String(vendor) }] },
    });
    if (vdoc) where.vendorId = vdoc.id;
  }
  if (featured === 'true') where.featured = true;
  if (minPrice != null || maxPrice != null) {
    where.price = {};
    if (minPrice != null) where.price.gte = Number(minPrice);
    if (maxPrice != null) where.price.lte = Number(maxPrice);
  }
  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.min(48, Math.max(1, Number(limit)));
  const lim = Math.min(48, Math.max(1, Number(limit)));

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'rating') orderBy = [{ averageRating: 'desc' }, { reviewCount: 'desc' }];

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        vendor: { select: { storeName: true, slug: true, logo: true, approvalStatus: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy,
      skip,
      take: lim,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: items.map((p) => toLegacy(p)),
    pagination: { total, page: Number(page), limit: lim, pages: Math.ceil(total / lim) },
  });
});

router.get('/by-id/:id', optionalAuth, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      vendor: true,
      category: true,
    },
  });
  if (!product || product.vendor?.approvalStatus !== 'approved') {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(toLegacy(product));
});

router.get('/:vendorSlug/:productSlug', optionalAuth, async (req, res) => {
  const vendor = await prisma.vendor.findFirst({
    where: { slug: req.params.vendorSlug, approvalStatus: 'approved' },
  });
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  const product = await prisma.product.findFirst({
    where: {
      vendorId: vendor.id,
      slug: req.params.productSlug,
      active: true,
    },
    include: {
      vendor: true,
      category: true,
    },
  });

  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(toLegacy(product));
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
    const cat = await prisma.category.findUnique({ where: { id: category } });
    if (!cat) return res.status(400).json({ message: 'Invalid category' });

    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
    let product = await prisma.product.create({
      data: {
        vendorId: v._id,
        categoryId: cat.id,
        title: title.trim(),
        slug: `tmp-${Date.now()}`,
        description: description || '',
        price: Number(price),
        compareAtPrice: compareAtPrice != null ? Number(compareAtPrice) : null,
        stock: Number(stock) || 0,
        sku: sku || '',
        images,
        featured: featured === true || featured === 'true',
      },
    });
    const slug = `${slugify(title.trim())}-${product.id.slice(-6)}`;
    product = await prisma.product.update({
      where: { id: product.id },
      data: { slug },
      include: {
        vendor: { select: { storeName: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    res.status(201).json(toLegacy(product));
  }
);

router.patch(
  '/:id',
  protect,
  allowRoles('vendor', 'admin'),
  loadVendor,
  upload.array('images', 8),
  async (req, res) => {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'vendor') {
      if (!req.vendorProfile || existing.vendorId !== req.vendorProfile._id) {
        return res.status(403).json({ message: 'Not your product' });
      }
      if (req.vendorProfile.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'Vendor not approved' });
      }
    }

    const body = req.body;
    const updates = {};
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.compareAtPrice !== undefined) updates.compareAtPrice = Number(body.compareAtPrice);
    if (body.stock !== undefined) updates.stock = Number(body.stock);
    if (body.sku !== undefined) updates.sku = body.sku;
    if (body.active !== undefined) updates.active = body.active === true || body.active === 'true';
    if (body.featured !== undefined) updates.featured = body.featured === true || body.featured === 'true';
    if (body.category !== undefined) updates.categoryId = body.category;
    if (body.title !== undefined) {
      updates.title = body.title.trim();
      updates.slug = `${slugify(body.title.trim())}-${existing.id.slice(-6)}`;
    }
    if (req.files?.length) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      updates.images = [...(existing.images || []), ...newImages].slice(0, 10);
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        vendor: { select: { storeName: true, slug: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    res.json(toLegacy(product));
  }
);

router.delete('/:id', protect, allowRoles('vendor', 'admin'), loadVendor, async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'vendor') {
    if (!req.vendorProfile || product.vendorId !== req.vendorProfile._id) {
      return res.status(403).json({ message: 'Not your product' });
    }
  }
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
