import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';
import { formatOrderResponse, normalizeOrder } from '../utils/orderFormat.js';
import { newId } from '../lib/ids.js';

const router = express.Router();
router.use(protect, allowRoles('admin'));

function nowIso() {
  return new Date().toISOString();
}

router.get('/analytics', async (_req, res) => {
  const sb = getSupabase();

  const { count: users } = await sb.from('User').select('id', { count: 'exact', head: true });
  const { count: vendors } = await sb
    .from('Vendor')
    .select('id', { count: 'exact', head: true })
    .eq('approvalStatus', 'approved');
  const { count: products } = await sb
    .from('Product')
    .select('id', { count: 'exact', head: true })
    .eq('active', true);
  const { count: ordersCount } = await sb
    .from('Order')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'pending_payment');

  const { data: paidOrders } = await sb
    .from('Order')
    .select('total, OrderSuborder(commissionTotal)')
    .in('status', ['paid', 'processing', 'shipped', 'delivered']);

  let gross = 0;
  let commissionTotal = 0;
  for (const o of paidOrders || []) {
    gross += Number(o.total) || 0;
    const subs = o.OrderSuborder || [];
    for (const s of subs) {
      commissionTotal += Number(s.commissionTotal) || 0;
    }
  }

  res.json({
    users: users ?? 0,
    vendors: vendors ?? 0,
    products: products ?? 0,
    orders: ordersCount ?? 0,
    grossRevenue: Math.round(Number(gross) * 100) / 100,
    platformCommission: Math.round(commissionTotal * 100) / 100,
  });
});

router.get('/pending-vendors', async (_req, res) => {
  const sb = getSupabase();
  const { data: list, error } = await sb
    .from('Vendor')
    .select('*, User(name, email, createdAt)')
    .eq('approvalStatus', 'pending')
    .order('createdAt', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  const mapped = (list || []).map((v) => {
    const row = { ...v, user: v.User };
    delete row.User;
    return toLegacy(row);
  });
  res.json(mapped);
});

router.patch('/vendors/:id', async (req, res) => {
  const { approvalStatus, rejectionReason, commissionOverridePercent } = req.body;
  const sb = getSupabase();
  const { data: v } = await sb.from('Vendor').select('*').eq('id', req.params.id).maybeSingle();
  if (!v) return res.status(404).json({ message: 'Not found' });

  const data = { updatedAt: nowIso() };
  const ts = nowIso();

  if (approvalStatus === 'approved') {
    data.approvalStatus = 'approved';
    data.approvedAt = new Date().toISOString();
    data.rejectionReason = '';
    await sb.from('Notification').insert({
      id: newId(),
      userId: v.userId,
      title: 'Vendor approved',
      body: `${v.storeName} is live on KTU E-MARKET.`,
      type: 'vendor',
      updatedAt: ts,
    });
  } else if (approvalStatus === 'rejected') {
    data.approvalStatus = 'rejected';
    data.rejectionReason = rejectionReason || '';
    await sb.from('Notification').insert({
      id: newId(),
      userId: v.userId,
      title: 'Vendor application update',
      body: rejectionReason || 'Your application needs updates.',
      type: 'vendor',
      updatedAt: ts,
    });
  }
  if (commissionOverridePercent != null) {
    data.commissionOverridePercent = Number(commissionOverridePercent);
  }

  if (Object.keys(data).length <= 1) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const { data: updated, error } = await sb.from('Vendor').update(data).eq('id', req.params.id).select('*').single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(toLegacy(updated));
});

router.get('/users', async (_req, res) => {
  const sb = getSupabase();
  const { data: users, error } = await sb
    .from('User')
    .select('id, name, email, role, avatar, phone, createdAt, updatedAt')
    .order('createdAt', { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ message: error.message });
  res.json((users || []).map((u) => toLegacy(u)));
});

router.patch('/users/:id', async (req, res) => {
  const updates = { updatedAt: nowIso() };
  if (req.body.role && ['customer', 'vendor', 'admin'].includes(req.body.role)) {
    updates.role = req.body.role;
  }
  if (req.body.name) updates.name = req.body.name;
  const sb = getSupabase();
  const { data: u, error } = await sb
    .from('User')
    .update(updates)
    .eq('id', req.params.id)
    .select('id, name, email, role, avatar, phone, createdAt')
    .maybeSingle();
  if (error || !u) return res.status(404).json({ message: 'Not found' });
  res.json(toLegacy(u));
});

router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete yourself' });
  }
  const sb = getSupabase();
  const { error } = await sb.from('User').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

router.get('/orders', async (_req, res) => {
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
    .order('createdAt', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ message: error.message });
  res.json((orders || []).map((o) => formatOrderResponse(normalizeOrder(o))));
});

router.get('/products', async (_req, res) => {
  const sb = getSupabase();
  const { data: products, error } = await sb
    .from('Product')
    .select('*, Vendor(storeName, slug), Category(name, slug)')
    .order('createdAt', { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ message: error.message });
  const mapped = (products || []).map((p) => {
    const row = { ...p, vendor: p.Vendor, category: p.Category };
    delete row.Vendor;
    delete row.Category;
    return toLegacy(row);
  });
  res.json(mapped);
});

router.delete('/products/:id', async (req, res) => {
  const sb = getSupabase();
  const { error } = await sb.from('Product').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

router.delete('/categories/:id', async (req, res) => {
  const sb = getSupabase();
  const { error } = await sb.from('Category').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

export default router;
