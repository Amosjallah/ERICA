import express from 'express';
import { getSupabase } from '../lib/supabase.js';
import { protect } from '../middleware/auth.js';
import { toLegacy } from '../utils/legacy.js';
import { newId } from '../lib/ids.js';

const router = express.Router();

router.use(protect);

function nowIso() {
  return new Date().toISOString();
}

async function getOrCreateCart(sb, userId) {
  const { data: cart } = await sb.from('Cart').select('*').eq('userId', userId).maybeSingle();
  if (cart) return cart;
  const id = newId();
  const ts = nowIso();
  const { data: created, error } = await sb.from('Cart').insert({ id, userId, updatedAt: ts }).select('*').single();
  if (error) throw error;
  return created;
}

async function cartPayload(sb, cartId, filterApproved = false) {
  const { data: cart } = await sb.from('Cart').select('*').eq('id', cartId).maybeSingle();
  const { data: rows } = await sb
    .from('CartItem')
    .select('*, Product(*, Vendor(storeName, slug, approvalStatus)))')
    .eq('cartId', cartId);

  let list = rows || [];
  list = list.map((r) => ({
    ...r,
    product: r.Product ? { ...r.Product, vendor: r.Product.Vendor } : null,
  }));

  let rowsFiltered = list;
  if (filterApproved) {
    rowsFiltered = list.filter((i) => i.product?.vendor?.approvalStatus === 'approved');
  }
  const items = rowsFiltered.map((i) => ({
    product: toLegacy(i.product),
    quantity: i.quantity,
  }));
  return { _id: cart.id, user: cart.userId, items };
}

router.get('/', async (req, res) => {
  try {
    const sb = getSupabase();
    const cart = await getOrCreateCart(sb, req.user._id);
    const payload = await cartPayload(sb, cart.id, true);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'Invalid product' });

    const sb = getSupabase();
    const { data: product, error: pe } = await sb
      .from('Product')
      .select('*, Vendor(*)')
      .eq('id', productId)
      .maybeSingle();
    if (pe || !product?.active) return res.status(404).json({ message: 'Product not found' });
    const vendor = product.Vendor;
    if (!vendor || vendor.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'Vendor not available' });
    }
    const qty = Math.max(1, Number(quantity));
    if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

    const cart = await getOrCreateCart(sb, req.user._id);
    const { data: existing } = await sb
      .from('CartItem')
      .select('*')
      .eq('cartId', cart.id)
      .eq('productId', productId)
      .maybeSingle();

    if (existing) {
      const nextQty = existing.quantity + qty;
      if (product.stock < nextQty) return res.status(400).json({ message: 'Insufficient stock' });
      const { error } = await sb
        .from('CartItem')
        .update({ quantity: nextQty })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('CartItem').insert({
        id: newId(),
        cartId: cart.id,
        productId,
        quantity: qty,
      });
      if (error) throw error;
    }

    res.json(await cartPayload(sb, cart.id, false));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/items/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const pid = req.params.productId;
    const qty = Math.max(1, Number(quantity));

    const sb = getSupabase();
    const { data: product } = await sb.from('Product').select('*').eq('id', pid).maybeSingle();
    if (!product?.active) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });

    const cart = await getOrCreateCart(sb, req.user._id);
    const { data: line } = await sb
      .from('CartItem')
      .select('*')
      .eq('cartId', cart.id)
      .eq('productId', pid)
      .maybeSingle();
    if (!line) return res.status(404).json({ message: 'Item not in cart' });
    const { error } = await sb.from('CartItem').update({ quantity: qty }).eq('id', line.id);
    if (error) throw error;

    res.json(await cartPayload(sb, cart.id, false));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/items/:productId', async (req, res) => {
  try {
    const sb = getSupabase();
    const cart = await getOrCreateCart(sb, req.user._id);
    await sb.from('CartItem').delete().eq('cartId', cart.id).eq('productId', req.params.productId);
    res.json(await cartPayload(sb, cart.id, false));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const sb = getSupabase();
    const cart = await getOrCreateCart(sb, req.user._id);
    await sb.from('CartItem').delete().eq('cartId', cart.id);
    res.json(await cartPayload(sb, cart.id, false));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
