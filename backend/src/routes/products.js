import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { slugify } from '../utils/slugify.js';
import { optionalAuth, protect, allowRoles } from '../middleware/auth.js';
import { loadVendor, requireApprovedVendor } from '../middleware/vendor.js';
import { upload } from '../middleware/upload.js';
import { toLegacy } from '../utils/legacy.js';
import { parsePagination } from '../utils/pagination.js';
import { newId } from '../lib/ids.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

function escapeIlike(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ');
}

router.get('/', optionalAuth, async (req, res) => {
  const {
    q,
    category,
    vendor,
    minPrice,
    maxPrice,
    featured,
    sort = 'newest',
  } = req.query;

  const sb = getSupabase();
  const { data: approvedVendors } = await sb.from('Vendor').select('id').eq('approvalStatus', 'approved');
  const vendorIds = (approvedVendors || []).map((v) => v.id);
  const { page: pageNum, limit: lim, skip } = parsePagination(req.query, 12, 48);
  if (!vendorIds.length) {
    return res.json({
      products: [],
      pagination: { total: 0, page: pageNum, limit: lim, pages: 0 },
    });
  }

  let categoryId = null;
  if (category) {
    const c = String(category);
    const { data: bySlug } = await sb.from('Category').select('id').eq('slug', c).maybeSingle();
    const { data: byId } = bySlug ? { data: null } : await sb.from('Category').select('id').eq('id', c).maybeSingle();
    categoryId = bySlug?.id || byId?.id || null;
  }

  let vendorId = null;
  if (vendor) {
    const v = String(vendor);
    const { data: bySlug } = await sb.from('Vendor').select('id').eq('slug', v).maybeSingle();
    const { data: byId } = bySlug ? { data: null } : await sb.from('Vendor').select('id').eq('id', v).maybeSingle();
    vendorId = bySlug?.id || byId?.id || null;
  }

  let query = sb
    .from('Product')
    .select('*, Vendor(storeName, slug, logo, approvalStatus), Category(name, slug)', { count: 'exact' })
    .eq('active', true)
    .in('vendorId', vendorIds);

  if (categoryId) query = query.eq('categoryId', categoryId);
  if (vendorId) query = query.eq('vendorId', vendorId);
  if (featured === 'true') query = query.eq('featured', true);
  const minP = Number(minPrice);
  if (minPrice != null && minPrice !== '' && Number.isFinite(minP)) query = query.gte('price', minP);
  const maxP = Number(maxPrice);
  if (maxPrice != null && maxPrice !== '' && Number.isFinite(maxP)) query = query.lte('price', maxP);
  if (q?.trim()) {
    const pat = `%${escapeIlike(q.trim())}%`;
    query = query.or(`title.ilike.${pat},description.ilike.${pat}`);
  }

  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else if (sort === 'rating') {
    query = query.order('averageRating', { ascending: false }).order('reviewCount', { ascending: false });
  } else {
    query = query.order('createdAt', { ascending: false });
  }

  query = query.range(skip, skip + lim - 1);

  const { data: items, error, count } = await query;
  if (error) return res.status(500).json({ message: error.message });

  const total = count ?? 0;
  const mapped = (items || []).map((p) => {
    const row = {
      ...p,
      vendor: p.Vendor,
      category: p.Category,
    };
    delete row.Vendor;
    delete row.Category;
    return toLegacy(row);
  });

  res.json({
    products: mapped,
    pagination: { total, page: pageNum, limit: lim, pages: lim > 0 ? Math.ceil(total / lim) : 0 },
  });
});

router.get('/mine', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(403).json({ message: 'Vendor only' });
  const { q, category, active } = req.query;
  const sb = getSupabase();
  const { page: pageNum, limit: lim, skip } = parsePagination(req.query, 24, 100);

  let query = sb
    .from('Product')
    .select('*, Category(name, slug)', { count: 'exact' })
    .eq('vendorId', v._id)
    .order('createdAt', { ascending: false });

  if (category) query = query.eq('categoryId', String(category));
  if (active === 'true') query = query.eq('active', true);
  if (active === 'false') query = query.eq('active', false);
  if (q?.trim()) {
    const pat = `%${escapeIlike(q.trim())}%`;
    query = query.or(`title.ilike.${pat},description.ilike.${pat}`);
  }
  query = query.range(skip, skip + lim - 1);

  const { data: items, error, count } = await query;
  if (error) return res.status(500).json({ message: error.message });
  const mapped = (items || []).map((p) => {
    const row = { ...p, category: p.Category };
    delete row.Category;
    return toLegacy(row);
  });
  res.json({
    products: mapped,
    pagination: { total: count ?? 0, page: pageNum, limit: lim, pages: lim > 0 ? Math.ceil((count ?? 0) / lim) : 0 },
  });
});

router.get('/by-id/:id', optionalAuth, async (req, res) => {
  const sb = getSupabase();
  const { data: product, error } = await sb
    .from('Product')
    .select('*, Vendor(*), Category(*)')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  const row = product
    ? { ...product, vendor: product.Vendor, category: product.Category, Vendor: undefined, Category: undefined }
    : null;
  if (!row || row.vendor?.approvalStatus !== 'approved') {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(toLegacy(row));
});

router.get('/:vendorSlug/:productSlug', optionalAuth, async (req, res) => {
  const sb = getSupabase();
  const { data: vendor } = await sb
    .from('Vendor')
    .select('id')
    .eq('slug', req.params.vendorSlug)
    .eq('approvalStatus', 'approved')
    .maybeSingle();
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  const { data: product, error } = await sb
    .from('Product')
    .select('*, Vendor(*), Category(*)')
    .eq('vendorId', vendor.id)
    .eq('slug', req.params.productSlug)
    .eq('active', true)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const row = {
    ...product,
    vendor: product.Vendor,
    category: product.Category,
  };
  delete row.Vendor;
  delete row.Category;
  res.json(toLegacy(row));
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
    const sb = getSupabase();
    const { data: cat, error: ce } = await sb.from('Category').select('id').eq('id', category).maybeSingle();
    if (ce || !cat) return res.status(400).json({ message: 'Invalid category' });

    const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
    const id = newId();
    const ts = nowIso();
    const { data: created, error } = await sb
      .from('Product')
      .insert({
        id,
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
        updatedAt: ts,
      })
      .select('*')
      .single();
    if (error) return res.status(400).json({ message: error.message });

    const slug = `${slugify(title.trim())}-${created.id.slice(-6)}`;
    const { data: product, error: ue } = await sb
      .from('Product')
      .update({ slug, updatedAt: nowIso() })
      .eq('id', created.id)
      .select('*, Vendor(storeName, slug), Category(name, slug)')
      .single();
    if (ue) return res.status(400).json({ message: ue.message });

    const row = {
      ...product,
      vendor: product.Vendor,
      category: product.Category,
    };
    delete row.Vendor;
    delete row.Category;
    res.status(201).json(toLegacy(row));
  }
);

router.patch(
  '/:id',
  protect,
  allowRoles('vendor', 'admin'),
  loadVendor,
  upload.array('images', 8),
  async (req, res) => {
    const sb = getSupabase();
    const { data: existing, error: fe } = await sb.from('Product').select('*').eq('id', req.params.id).maybeSingle();
    if (fe || !existing) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'vendor') {
      if (!req.vendorProfile || existing.vendorId !== req.vendorProfile._id) {
        return res.status(403).json({ message: 'Not your product' });
      }
      if (req.vendorProfile.approvalStatus !== 'approved') {
        return res.status(403).json({ message: 'Vendor not approved' });
      }
    }

    const body = req.body;
    const updates = { updatedAt: nowIso() };
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

    const { data: product, error } = await sb
      .from('Product')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, Vendor(storeName, slug), Category(name, slug)')
      .single();
    if (error) return res.status(400).json({ message: error.message });

    const row = {
      ...product,
      vendor: product.Vendor,
      category: product.Category,
    };
    delete row.Vendor;
    delete row.Category;
    res.json(toLegacy(row));
  }
);

router.delete('/:id', protect, allowRoles('vendor', 'admin'), loadVendor, async (req, res) => {
  const sb = getSupabase();
  const { data: product } = await sb.from('Product').select('*').eq('id', req.params.id).maybeSingle();
  if (!product) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'vendor') {
    if (!req.vendorProfile || product.vendorId !== req.vendorProfile._id) {
      return res.status(403).json({ message: 'Not your product' });
    }
  }
  const { error } = await sb.from('Product').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ message: error.message });
  res.json({ ok: true });
});

export default router;
