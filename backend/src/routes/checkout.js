import express from 'express';
import Stripe from 'stripe';
import { getSupabase } from '../lib/supabase.js';
import { newId } from '../lib/ids.js';
import { protect } from '../middleware/auth.js';
import { formatOrderResponse, normalizeOrder } from '../utils/orderFormat.js';
import { getCommissionPercent } from '../utils/commission.js';

const router = express.Router();
router.use(protect);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

function nowIso() {
  return new Date().toISOString();
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('your_stripe')) return null;
  return new Stripe(key);
}

async function validateCoupon(sb, code, subtotal) {
  if (!code?.trim()) return { discount: 0, coupon: null };
  const c = (
    await sb.from('Coupon').select('*').eq('code', code.trim().toUpperCase()).eq('active', true).maybeSingle()
  ).data;
  if (!c) throw new Error('Invalid coupon');
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) throw new Error('Coupon expired');
  if (c.minOrderAmount && subtotal < c.minOrderAmount) throw new Error('Minimum order amount not met');
  if (c.maxUses != null && c.usesCount >= c.maxUses) throw new Error('Coupon no longer available');

  let discount = 0;
  if (c.discountType === 'percent') {
    discount = (subtotal * c.discountValue) / 100;
    if (c.discountValue > 100) discount = subtotal;
  } else {
    discount = c.discountValue;
  }
  discount = Math.min(discount, subtotal);
  return { discount, coupon: c };
}

export async function buildSubOrdersFromCart(sb, userId) {
  const { data: cart } = await sb.from('Cart').select('id').eq('userId', userId).maybeSingle();
  if (!cart) return { subOrders: [], subtotal: 0 };

  const { data: cartItems } = await sb.from('CartItem').select('quantity, productId').eq('cartId', cart.id);
  if (!cartItems?.length) return { subOrders: [], subtotal: 0 };

  const pids = [...new Set(cartItems.map((i) => i.productId))];
  const { data: prows } = await sb.from('Product').select('*, Vendor(*)').in('id', pids);
  const pmap = Object.fromEntries((prows || []).map((p) => [p.id, { ...p, vendor: p.Vendor }]));

  const byVendor = new Map();
  for (const line of cartItems) {
    const p = pmap[line.productId];
    if (!p?.active || !p.vendor || p.vendor.approvalStatus !== 'approved') continue;
    const vid = p.vendorId;
    if (!byVendor.has(vid)) byVendor.set(vid, { vendor: p.vendor, lines: [] });
    byVendor.get(vid).lines.push({ line, product: p });
  }

  const vendorIds = [...byVendor.keys()];
  const { data: vendorDocs } = await sb.from('Vendor').select('*').in('id', vendorIds);
  const vendorMap = Object.fromEntries((vendorDocs || []).map((v) => [v.id, v]));

  const subOrders = [];
  let subtotal = 0;

  for (const [vid, { vendor, lines }] of byVendor) {
    const vDoc = vendorMap[vid] || vendor;
    const commissionPct = getCommissionPercent(vDoc);
    const items = [];

    for (const { line, product } of lines) {
      const unitPrice = product.price;
      const quantity = line.quantity;
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for ${product.title}`);
      }
      const lineTotal = unitPrice * quantity;
      const commissionAmount = (lineTotal * commissionPct) / 100;
      const vendorPayout = lineTotal - commissionAmount;
      subtotal += lineTotal;
      items.push({
        product: product.id,
        vendor: product.vendorId,
        title: product.title,
        image: product.images?.[0] || '',
        unitPrice,
        quantity,
        lineTotal,
        commissionPercent: commissionPct,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        vendorPayout: Math.round(vendorPayout * 100) / 100,
      });
    }

    const subtotalVendor = items.reduce((s, i) => s + i.lineTotal, 0);
    const commissionTotal = items.reduce((s, i) => s + i.commissionAmount, 0);
    const vendorPayoutTotal = items.reduce((s, i) => s + i.vendorPayout, 0);

    subOrders.push({
      vendor: vendor.id,
      items,
      subtotal: Math.round(subtotalVendor * 100) / 100,
      commissionTotal: Math.round(commissionTotal * 100) / 100,
      vendorPayoutTotal: Math.round(vendorPayoutTotal * 100) / 100,
      status: 'pending',
    });
  }

  return { subOrders, subtotal };
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

router.post('/create-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const { shippingAddress, couponCode } = req.body;
    if (!shippingAddress?.line1 || !shippingAddress?.city) {
      return res.status(400).json({ message: 'Shipping address required' });
    }

    const sb = getSupabase();
    const { subOrders, subtotal } = await buildSubOrdersFromCart(sb, req.user._id);
    if (!subOrders.length) return res.status(400).json({ message: 'Cart is empty or no valid items' });

    let discountTotal = 0;
    let coupon = null;
    if (couponCode) {
      try {
        const v = await validateCoupon(sb, couponCode, subtotal);
        discountTotal = v.discount;
        coupon = v.coupon;
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
    }

    const shippingTotal = Number(process.env.FLAT_SHIPPING || 0) || 0;
    const total = Math.max(0, Math.round((subtotal - discountTotal + shippingTotal) * 100) / 100);

    const orderNumber = `EM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7)}`;
    const orderId = newId();
    const ts = nowIso();

    const { error: oe } = await sb.from('Order').insert({
      id: orderId,
      orderNumber,
      userId: req.user._id,
      status: 'pending_payment',
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      shippingTotal,
      total,
      couponCode: coupon ? coupon.code : '',
      shippingName: shippingAddress.name || req.user.name,
      shippingLine1: shippingAddress.line1,
      shippingLine2: shippingAddress.line2 || '',
      shippingCity: shippingAddress.city,
      shippingState: shippingAddress.state || '',
      shippingPostalCode: shippingAddress.postalCode || '',
      shippingCountry: shippingAddress.country || '',
      shippingPhone: shippingAddress.phone || '',
      updatedAt: ts,
    });
    if (oe) throw oe;

    for (const so of subOrders) {
      const sid = newId();
      const { error: se } = await sb.from('OrderSuborder').insert({
        id: sid,
        orderId,
        vendorId: so.vendor,
        subtotal: so.subtotal,
        commissionTotal: so.commissionTotal,
        vendorPayoutTotal: so.vendorPayoutTotal,
        status: 'pending',
      });
      if (se) throw se;

      for (const item of so.items) {
        const { error: le } = await sb.from('OrderLineItem').insert({
          id: newId(),
          suborderId: sid,
          productId: item.product,
          vendorId: item.vendor,
          title: item.title,
          image: item.image,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          commissionPercent: item.commissionPercent,
          commissionAmount: item.commissionAmount,
          vendorPayout: item.vendorPayout,
        });
        if (le) throw le;
      }
    }

    if (!stripe) {
      await finalizeOrderPayment(sb, orderId, coupon?.id ?? null, req.user._id, { provider: 'manual' });
      return res.json({
        url: `${clientUrl}/checkout/success?order=${orderNumber}&demo=1`,
        demo: true,
      });
    }

    const amountCents = Math.max(0, Math.round(total * 100));
    if (amountCents < 50) {
      return res.status(400).json({ message: 'Order total too small for payment' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `KTU E-MARKET — ${orderNumber}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cart`,
      metadata: {
        orderId,
        orderNumber,
      },
    });

    const { error: ue } = await sb.from('Order').update({ stripeSessionId: session.id, updatedAt: nowIso() }).eq('id', orderId);
    if (ue) throw ue;

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Checkout failed' });
  }
});

export async function finalizeOrderPayment(sb, orderId, couponId, userId, opts = {}) {
  const { error } = await sb.rpc('finalize_order_payment', {
    p_order_id: orderId,
    p_coupon_id: couponId || '',
    p_user_id: userId,
    p_provider: opts.provider || 'stripe',
  });
  if (error) throw new Error(error.message || 'Finalize failed');
}

router.post('/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const stripe = getStripe();
    if (!stripe || !sessionId) {
      return res.status(400).json({ message: 'Stripe not configured or missing session' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId) return res.status(400).json({ message: 'Invalid session' });

    const sb = getSupabase();
    const { data: order } = await sb.from('Order').select('*').eq('id', orderId).maybeSingle();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user._id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (order.status === 'paid') {
      const full = await fetchOrderFull(sb, order.id);
      return res.json({ order: formatOrderResponse(full), alreadyPaid: true });
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    let couponId = null;
    if (order.couponCode) {
      const { data: c } = await sb.from('Coupon').select('id').eq('code', order.couponCode).maybeSingle();
      couponId = c?.id ?? null;
    }

    await finalizeOrderPayment(sb, order.id, couponId, order.userId, { provider: 'stripe' });

    const updated = await fetchOrderFull(sb, order.id);
    res.json({ order: formatOrderResponse(updated) });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Verification failed' });
  }
});

export default router;
