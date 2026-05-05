import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { loadVendor } from '../middleware/vendor.js';
import { formatOrderResponse, normalizeOrder } from '../utils/orderFormat.js';

const router = express.Router();

function nowIso() {
  return new Date().toISOString();
}

async function fetchOrderFull(sb, orderId) {
  const { data: order, error } = await sb
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
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return normalizeOrder(order);
}

router.get('/vendor/order/:orderId', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor not found' });
  const sb = getSupabase();
  const { data: order, error } = await sb
    .from('Order')
    .select(
      `
      *,
      User(name, email, phone),
      OrderSuborder(
        *,
        OrderLineItem(*)
      )
    `
    )
    .eq('id', req.params.orderId)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!order) return res.status(404).json({ message: 'Not found' });
  const subs = order.OrderSuborder || [];
  if (!subs.some((s) => s.vendorId === req.vendorProfile._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(formatOrderResponse(normalizeOrder(order)));
});

router.get('/my', protect, async (req, res) => {
  const sb = getSupabase();
  const { data: orders, error } = await sb
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
    .eq('userId', req.user._id)
    .order('createdAt', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ message: error.message });
  res.json((orders || []).map((o) => formatOrderResponse(normalizeOrder(o))));
});

/** Customer (or admin) single order with line items — for /orders/[id] */
router.get('/my/:orderId', protect, async (req, res) => {
  try {
    const order = await fetchOrderFull(getSupabase(), req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (String(order.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const formatted = formatOrderResponse(order);
    if (!formatted) return res.status(404).json({ message: 'Not found' });
    res.json(formatted);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

router.get('/number/:orderNumber', protect, async (req, res) => {
  const sb = getSupabase();
  const { data: order, error } = await sb
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
    .eq('orderNumber', req.params.orderNumber)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!order) return res.status(404).json({ message: 'Not found' });
  const o = normalizeOrder(order);
  if (String(o.userId) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(formatOrderResponse(o));
});

router.get('/vendor', protect, allowRoles('vendor'), loadVendor, async (req, res) => {
  if (!req.vendorProfile) return res.status(404).json({ message: 'Vendor not found' });
  const sb = getSupabase();
  const { data: subs } = await sb.from('OrderSuborder').select('orderId').eq('vendorId', req.vendorProfile._id);
  const orderIds = [...new Set((subs || []).map((s) => s.orderId))];
  if (!orderIds.length) return res.json([]);

  const { data: orders, error } = await sb
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
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json((orders || []).map((o) => formatOrderResponse(normalizeOrder(o))));
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

    const sb = getSupabase();
    const { data: order, error: oe } = await sb
      .from('Order')
      .select('*, OrderSuborder(*)')
      .eq('id', req.params.orderId)
      .maybeSingle();
    if (oe || !order) return res.status(404).json({ message: 'Order not found' });
    const subs = order.OrderSuborder || [];
    if (!['paid', 'processing', 'shipped'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be updated' });
    }

    const sub = subs.find((s) => s.vendorId === req.vendorProfile._id);
    if (!sub) return res.status(404).json({ message: 'Sub-order not found' });

    const { error: ue } = await sb.from('OrderSuborder').update({ status }).eq('id', sub.id);
    if (ue) return res.status(400).json({ message: ue.message });

    let newOrderStatus = order.status;
    if (order.status === 'paid' && status === 'processing') newOrderStatus = 'processing';
    if (status === 'shipped') newOrderStatus = 'shipped';
    if (status === 'delivered') {
      const { data: refreshed } = await sb.from('OrderSuborder').select('*').eq('orderId', order.id);
      const allDone = (refreshed || []).every((s) => s.status === 'delivered' || s.status === 'cancelled');
      if (allDone) newOrderStatus = 'delivered';
    }
    if (status === 'cancelled') {
      const { data: refreshed } = await sb.from('OrderSuborder').select('*').eq('orderId', order.id);
      const allCancelled = (refreshed || []).every((s) => s.status === 'cancelled');
      if (allCancelled) newOrderStatus = 'cancelled';
    }

    await sb.from('Order').update({ status: newOrderStatus, updatedAt: nowIso() }).eq('id', order.id);

    const updated = await fetchOrderFull(sb, order.id);
    res.json(formatOrderResponse(updated));
  }
);

export default router;
