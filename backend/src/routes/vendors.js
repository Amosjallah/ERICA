import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';
import { formatOrderResponse, normalizeOrder } from '../utils/orderFormat.js';
import { toLegacy } from '../utils/legacy.js';
import { slugify } from '../utils/slugify.js';
import { upload } from '../middleware/upload.js';
import { newId } from '../lib/ids.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function monthKey(d) {
  const x = new Date(d);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
}

router.get('/stores', async (_req, res) => {
  const sb = getSupabase();
  const { data: vendors, error } = await sb
    .from('Vendor')
    .select('*')
    .eq('approvalStatus', 'approved')
    .order('storeName', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  const list = vendors || [];
  const userIds = [...new Set(list.map((v) => v.userId).filter(Boolean))];
  const nameByUserId = {};
  if (userIds.length) {
    const { data: users, error: ue } = await sb.from('User').select('id, name').in('id', userIds);
    if (ue) return res.status(500).json({ message: ue.message });
    for (const u of users || []) nameByUserId[u.id] = u.name;
  }
  const mapped = list.map((v) => toLegacy({ ...v, user: { name: nameByUserId[v.userId] || '' } }));
  res.json(mapped);
});

router.get('/store/:slug', async (req, res) => {
  const sb = getSupabase();
  const { data: vendor, error: ve } = await sb
    .from('Vendor')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('approvalStatus', 'approved')
    .maybeSingle();
  if (ve) return res.status(500).json({ message: ve.message });
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  let ownerName = '';
  if (vendor.userId) {
    const { data: owner, error: oe } = await sb.from('User').select('name').eq('id', vendor.userId).maybeSingle();
    if (oe) return res.status(500).json({ message: oe.message });
    ownerName = owner?.name || '';
  }

  const { data: products, error: pe } = await sb
    .from('Product')
    .select('*, Category(name, slug)')
    .eq('vendorId', vendor.id)
    .eq('active', true)
    .order('createdAt', { ascending: false });
  if (pe) return res.status(500).json({ message: pe.message });

  const vrow = { ...vendor, user: { name: ownerName } };
  const prows = (products || []).map((p) => {
    const row = { ...p, category: p.Category };
    delete row.Category;
    return toLegacy(row);
  });
  res.json({ vendor: toLegacy(vrow), products: prows });
});

router.get('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const sb = getSupabase();
  const { data: row, error } = await sb.from('Vendor').select('*').eq('id', req.vendorProfile._id).single();
  if (error || !row) return res.status(404).json({ message: 'Vendor profile not found' });
  res.json(toLegacy(row));
});

router.patch('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });
  const { storeName, description, flatShippingFee, shippingPolicy, returnPolicy } = req.body;
  const data = { updatedAt: nowIso() };
  if (storeName) {
    data.storeName = storeName.trim();
    data.slug = `${slugify(storeName.trim())}-${req.vendorProfile._id.slice(-6)}`;
  }
  if (description !== undefined) data.description = description;
  if (flatShippingFee !== undefined) data.flatShippingFee = Math.max(0, Number(flatShippingFee) || 0);
  if (shippingPolicy !== undefined) data.shippingPolicy = String(shippingPolicy);
  if (returnPolicy !== undefined) data.returnPolicy = String(returnPolicy);
  const sb = getSupabase();
  const { data: v, error } = await sb
    .from('Vendor')
    .update(data)
    .eq('id', req.vendorProfile._id)
    .select('*')
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(toLegacy(v));
});

router.post(
  '/me/branding',
  protect,
  allowRoles('vendor'),
  loadVendor,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  async (req, res) => {
    if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });
    const data = { updatedAt: nowIso() };
    const files = req.files;
    if (files?.logo?.[0]) data.logo = `/uploads/${files.logo[0].filename}`;
    if (files?.banner?.[0]) data.banner = `/uploads/${files.banner[0].filename}`;
    if (!data.logo && !data.banner) {
      return res.status(400).json({ message: 'Provide logo and/or banner file' });
    }
    const sb = getSupabase();
    const { data: v, error } = await sb
      .from('Vendor')
      .update(data)
      .eq('id', req.vendorProfile._id)
      .select('*')
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.json(toLegacy(v));
  }
);

router.get('/dashboard/summary', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(404).json({ message: 'Vendor not found' });

  const sb = getSupabase();
  const { count: productCount } = await sb
    .from('Product')
    .select('id', { count: 'exact', head: true })
    .eq('vendorId', v._id);

  const { data: subs } = await sb.from('OrderSuborder').select('*').eq('vendorId', v._id);
  const orderIds = [...new Set((subs || []).map((s) => s.orderId))];
  let orders = [];
  if (orderIds.length) {
    const { data: orows } = await sb
      .from('Order')
      .select('*, OrderSuborder(*)')
      .in('id', orderIds)
      .in('status', ['paid', 'processing', 'shipped', 'delivered']);
    orders = orows || [];
  }

  let revenue = 0;
  let orderCount = 0;
  for (const o of orders) {
    const subsList = o.OrderSuborder || [];
    for (const sub of subsList) {
      if (sub.vendorId === v._id) {
        orderCount += 1;
        revenue += sub.vendorPayoutTotal || 0;
      }
    }
  }

  let recentOrders = [];
  if (orderIds.length) {
    const { data: r } = await sb
      .from('Order')
      .select(
        `
        *,
        User(name, email),
        OrderSuborder(
          *,
          OrderLineItem(*)
        )
      `
      )
      .in('id', orderIds)
      .order('createdAt', { ascending: false })
      .limit(5);
    recentOrders = (r || []).map((o) => formatOrderResponse(normalizeOrder(o)));
  }

  res.json({
    productCount: productCount ?? 0,
    orderCount,
    revenue: Math.round(revenue * 100) / 100,
    approvalStatus: v.approvalStatus,
    recentOrders,
  });
});

router.get('/dashboard/overview', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(404).json({ message: 'Vendor not found' });
  const sb = getSupabase();

  const { count: productCount } = await sb
    .from('Product')
    .select('id', { count: 'exact', head: true })
    .eq('vendorId', v._id);

  const { data: subs } = await sb
    .from('OrderSuborder')
    .select('subtotal, vendorPayoutTotal, status, orderId, Order(createdAt, status, orderNumber)')
    .eq('vendorId', v._id);

  const list = subs || [];
  const paidLike = ['paid', 'processing', 'shipped', 'delivered'];
  let totalSales = 0;
  let revenue = 0;
  let orderCount = 0;
  const orderSeen = new Set();
  const byDay = {};
  const byMonth = {};

  for (const s of list) {
    const ord = s.Order;
    if (!ord || !paidLike.includes(ord.status)) continue;
    totalSales += Number(s.subtotal) || 0;
    revenue += Number(s.vendorPayoutTotal) || 0;
    if (!orderSeen.has(s.orderId)) {
      orderSeen.add(s.orderId);
      orderCount += 1;
    }
    const d = ord.createdAt;
    const dk = dayKey(d);
    const mk = monthKey(d);
    byDay[dk] = (byDay[dk] || 0) + (Number(s.subtotal) || 0);
    byMonth[mk] = (byMonth[mk] || 0) + (Number(s.subtotal) || 0);
  }

  const salesByWeek = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([label, amount]) => ({ label, amount: Math.round(amount * 100) / 100 }));
  const salesByMonth = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([label, amount]) => ({ label, amount: Math.round(amount * 100) / 100 }));

  const orderIds = [...new Set(list.map((x) => x.orderId))];
  let recentOrders = [];
  if (orderIds.length) {
    const { data: r } = await sb
      .from('Order')
      .select(
        `
        *,
        User(name, email),
        OrderSuborder(
          *,
          OrderLineItem(*)
        )
      `
      )
      .in('id', orderIds)
      .order('createdAt', { ascending: false })
      .limit(8);
    recentOrders = (r || []).map((o) => formatOrderResponse(normalizeOrder(o)));
  }

  res.json({
    productCount: productCount ?? 0,
    orderCount,
    totalSales: Math.round(totalSales * 100) / 100,
    revenue: Math.round(revenue * 100) / 100,
    approvalStatus: v.approvalStatus,
    salesByWeek,
    salesByMonth,
    recentOrders,
  });
});

router.get('/customers', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(404).json({ message: 'Vendor not found' });
  const sb = getSupabase();
  const { data: subs } = await sb.from('OrderSuborder').select('orderId').eq('vendorId', v._id);
  const orderIds = [...new Set((subs || []).map((s) => s.orderId))];
  if (!orderIds.length) return res.json([]);

  const { data: orders, error } = await sb
    .from('Order')
    .select('id, userId, User(name, email), orderNumber, createdAt, status')
    .in('id', orderIds)
    .in('status', ['paid', 'processing', 'shipped', 'delivered']);
  if (error) return res.status(500).json({ message: error.message });

  const byUser = new Map();
  for (const o of orders || []) {
    const uid = o.userId;
    if (!byUser.has(uid)) {
      byUser.set(uid, {
        userId: uid,
        name: o.User?.name || '',
        email: o.User?.email || '',
        orderCount: 0,
        lastOrderAt: o.createdAt,
      });
    }
    const row = byUser.get(uid);
    row.orderCount += 1;
    if (new Date(o.createdAt) > new Date(row.lastOrderAt)) row.lastOrderAt = o.createdAt;
  }
  res.json([...byUser.values()].sort((a, b) => String(b.lastOrderAt).localeCompare(String(a.lastOrderAt))));
});

router.get('/earnings', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const v = req.vendorProfile;
  if (!v) return res.status(404).json({ message: 'Vendor not found' });
  const sb = getSupabase();
  const { data: subs, error } = await sb
    .from('OrderSuborder')
    .select('*, Order(orderNumber, createdAt, status)')
    .eq('vendorId', v._id)
    .order('id', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });

  const rows = subs || [];
  let pending = 0;
  let completed = 0;
  const transactions = [];

  for (const s of rows) {
    const ord = s.Order;
    const payout = Number(s.vendorPayoutTotal) || 0;
    if (s.status === 'delivered') completed += payout;
    else if (['pending', 'processing', 'shipped'].includes(s.status)) pending += payout;

    transactions.push({
      id: s.id,
      orderNumber: ord?.orderNumber || '',
      orderStatus: ord?.status,
      suborderStatus: s.status,
      subtotal: s.subtotal,
      commissionTotal: s.commissionTotal,
      vendorPayout: payout,
      createdAt: ord?.createdAt || null,
    });
  }

  res.json({
    pendingPayouts: Math.round(pending * 100) / 100,
    completedPayouts: Math.round(completed * 100) / 100,
    transactions,
  });
});

router.get('/me/coupons', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const sb = getSupabase();
  const { data: list, error } = await sb
    .from('Coupon')
    .select('*')
    .eq('vendorId', req.vendorProfile._id)
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json((list || []).map((c) => toLegacy(c)));
});

router.post('/me/coupons', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxUses,
    minOrderAmount,
    expiresAt,
    active,
  } = req.body;
  if (!code?.trim() || !discountType || discountValue == null) {
    return res.status(400).json({ message: 'code, discountType, discountValue required' });
  }
  const sb = getSupabase();
  const ts = nowIso();
  const { data: doc, error } = await sb
    .from('Coupon')
    .insert({
      id: newId(),
      code: String(code).trim().toUpperCase(),
      description: description ?? '',
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses != null ? Number(maxUses) : null,
      minOrderAmount: minOrderAmount != null ? Number(minOrderAmount) : 0,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: active !== false,
      vendorId: req.vendorProfile._id,
      updatedAt: ts,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Coupon code already exists' });
    return res.status(400).json({ message: error.message });
  }
  res.status(201).json(toLegacy(doc));
});

router.patch('/me/coupons/:id', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const sb = getSupabase();
  const { data: existing } = await sb
    .from('Coupon')
    .select('id')
    .eq('id', req.params.id)
    .eq('vendorId', req.vendorProfile._id)
    .maybeSingle();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  const payload = { updatedAt: nowIso() };
  const allowed = ['code', 'description', 'discountType', 'discountValue', 'maxUses', 'minOrderAmount', 'expiresAt', 'active'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      if (k === 'code') payload[k] = String(req.body[k]).toUpperCase();
      else if (k === 'discountValue' || k === 'maxUses' || k === 'minOrderAmount') payload[k] = req.body[k] == null ? null : Number(req.body[k]);
      else if (k === 'expiresAt') payload[k] = req.body[k] ? new Date(req.body[k]).toISOString() : null;
      else payload[k] = req.body[k];
    }
  }
  const { data: c, error } = await sb.from('Coupon').update(payload).eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(toLegacy(c));
});

router.delete('/me/coupons/:id', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  const sb = getSupabase();
  const { error } = await sb
    .from('Coupon')
    .delete()
    .eq('id', req.params.id)
    .eq('vendorId', req.vendorProfile._id);
  if (error) return res.status(400).json({ message: error.message });
  res.json({ ok: true });
});

export default router;
