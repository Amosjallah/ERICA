import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';
import { formatOrderResponse, normalizeOrder } from '../utils/orderFormat.js';
import { toLegacy } from '../utils/legacy.js';
import { slugify } from '../utils/slugify.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

router.get('/stores', async (_req, res) => {
  const sb = getSupabase();
  const { data: vendors, error } = await sb
    .from('Vendor')
    .select('*, User(name)')
    .eq('approvalStatus', 'approved')
    .order('storeName', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  const mapped = (vendors || []).map((v) => {
    const row = { ...v, user: v.User };
    delete row.User;
    return toLegacy(row);
  });
  res.json(mapped);
});

router.get('/store/:slug', async (req, res) => {
  const sb = getSupabase();
  const { data: vendor, error: ve } = await sb
    .from('Vendor')
    .select('*, User(name)')
    .eq('slug', req.params.slug)
    .eq('approvalStatus', 'approved')
    .maybeSingle();
  if (ve) return res.status(500).json({ message: ve.message });
  if (!vendor) return res.status(404).json({ message: 'Store not found' });

  const { data: products, error: pe } = await sb
    .from('Product')
    .select('*, Category(name, slug)')
    .eq('vendorId', vendor.id)
    .eq('active', true)
    .order('createdAt', { ascending: false });
  if (pe) return res.status(500).json({ message: pe.message });

  const vrow = { ...vendor, user: vendor.User };
  delete vrow.User;
  const prows = (products || []).map((p) => {
    const row = { ...p, category: p.Category };
    delete row.Category;
    return toLegacy(row);
  });
  res.json({ vendor: toLegacy(vrow), products: prows });
});

router.get('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  res.json(req.vendorProfile);
});

router.patch('/me', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });
  const { storeName, description } = req.body;
  const data = { updatedAt: nowIso() };
  if (storeName) {
    data.storeName = storeName.trim();
    data.slug = `${slugify(storeName.trim())}-${req.vendorProfile._id.slice(-6)}`;
  }
  if (description !== undefined) data.description = description;
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

export default router;
