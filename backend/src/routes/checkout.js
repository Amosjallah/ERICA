import express from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { Order } from '../models/Order.js';
import { Coupon } from '../models/Coupon.js';
import { Notification } from '../models/Notification.js';
import { getCommissionPercent } from '../utils/commission.js';

const router = express.Router();
router.use(protect);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('your_stripe')) return null;
  return new Stripe(key);
}

async function validateCoupon(code, subtotal) {
  if (!code?.trim()) return { discount: 0, coupon: null };
  const c = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
  if (!c) throw new Error('Invalid coupon');
  if (c.expiresAt && c.expiresAt < new Date()) throw new Error('Coupon expired');
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

export async function buildSubOrdersFromCart(cart) {
  await cart.populate({
    path: 'items.product',
    populate: { path: 'vendor' },
  });

  const byVendor = new Map();
  for (const line of cart.items) {
    const p = line.product;
    if (!p?.active || !p.vendor || p.vendor.approvalStatus !== 'approved') continue;
    const vid = p.vendor._id.toString();
    if (!byVendor.has(vid)) byVendor.set(vid, { vendor: p.vendor, lines: [] });
    byVendor.get(vid).lines.push({ line, product: p });
  }

  const vendorDocs = await Vendor.find({
    _id: { $in: [...byVendor.keys()].map((id) => new mongoose.Types.ObjectId(id)) },
  });
  const vendorMap = Object.fromEntries(vendorDocs.map((v) => [v._id.toString(), v]));

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
        product: product._id,
        vendor: product.vendor._id,
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
      vendor: vendor._id,
      items,
      subtotal: Math.round(subtotalVendor * 100) / 100,
      commissionTotal: Math.round(commissionTotal * 100) / 100,
      vendorPayoutTotal: Math.round(vendorPayoutTotal * 100) / 100,
      status: 'pending',
    });
  }

  return { subOrders, subtotal };
}

router.post('/create-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const { shippingAddress, couponCode } = req.body;
    if (!shippingAddress?.line1 || !shippingAddress?.city) {
      return res.status(400).json({ message: 'Shipping address required' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items?.length) return res.status(400).json({ message: 'Cart is empty' });

    const { subOrders, subtotal } = await buildSubOrdersFromCart(cart);
    if (!subOrders.length) return res.status(400).json({ message: 'No valid items' });

    let discountTotal = 0;
    let coupon = null;
    if (couponCode) {
      try {
        const v = await validateCoupon(couponCode, subtotal);
        discountTotal = v.discount;
        coupon = v.coupon;
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
    }

    const shippingTotal = Number(process.env.FLAT_SHIPPING || 0) || 0;
    const total = Math.max(0, Math.round((subtotal - discountTotal + shippingTotal) * 100) / 100);

    const orderNumber = `EM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7)}`;

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      status: 'pending_payment',
      subOrders,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      shippingTotal,
      total,
      couponCode: coupon ? coupon.code : '',
      shippingAddress: {
        name: shippingAddress.name || req.user.name,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country || '',
        phone: shippingAddress.phone || '',
      },
    });

    if (!stripe) {
      await finalizeOrderPayment(order, coupon, cart, { provider: 'manual' });
      return res.json({
        url: `${clientUrl}/checkout/success?order=${order.orderNumber}&demo=1`,
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
              name: `Ericah Marketplace — ${order.orderNumber}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cart`,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Checkout failed' });
  }
});

async function finalizeOrderPayment(order, couponDoc, _cart, opts = {}) {
  for (const sub of order.subOrders) {
    for (const line of sub.items) {
      await Product.findByIdAndUpdate(line.product, {
        $inc: { stock: -line.quantity },
      });
    }
  }
  if (couponDoc) {
    await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usesCount: 1 } });
  }
  order.status = 'paid';
  order.paymentProvider = opts.provider || 'stripe';
  await order.save();

  await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

  await Notification.create({
    user: order.user,
    title: 'Order placed',
    body: `Order ${order.orderNumber} confirmed.`,
    type: 'order',
    meta: { orderId: order._id },
  });

  const vendorIds = [...new Set(order.subOrders.map((s) => s.vendor.toString()))];
  for (const vid of vendorIds) {
    const v = await Vendor.findById(vid);
    if (v?.user) {
      await Notification.create({
        user: v.user,
        title: 'New order',
        body: `Order ${order.orderNumber} includes your products.`,
        type: 'order',
        meta: { orderId: order._id },
      });
    }
  }
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

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (order.status === 'paid') {
      return res.json({ order, alreadyPaid: true });
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const coupon = order.couponCode
      ? await Coupon.findOne({ code: order.couponCode })
      : null;
    const cart = await Cart.findOne({ user: order.user });
    await finalizeOrderPayment(order, coupon, cart, { provider: 'stripe' });

    const updated = await Order.findById(order._id);
    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Verification failed' });
  }
});

export { finalizeOrderPayment };

export default router;
