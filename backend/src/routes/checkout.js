import express from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { protect } from '../middleware/auth.js';
import { formatOrderResponse } from '../utils/orderFormat.js';
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
  const c = await prisma.coupon.findFirst({
    where: { code: code.trim().toUpperCase(), active: true },
  });
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

export async function buildSubOrdersFromCart(userId) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { vendor: true } },
        },
      },
    },
  });

  if (!cart?.items?.length) return { subOrders: [], subtotal: 0 };

  const byVendor = new Map();
  for (const line of cart.items) {
    const p = line.product;
    if (!p?.active || !p.vendor || p.vendor.approvalStatus !== 'approved') continue;
    const vid = p.vendorId;
    if (!byVendor.has(vid)) byVendor.set(vid, { vendor: p.vendor, lines: [] });
    byVendor.get(vid).lines.push({ line, product: p });
  }

  const vendorIds = [...byVendor.keys()];
  const vendorDocs = await prisma.vendor.findMany({ where: { id: { in: vendorIds } } });
  const vendorMap = Object.fromEntries(vendorDocs.map((v) => [v.id, v]));

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

router.post('/create-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const { shippingAddress, couponCode } = req.body;
    if (!shippingAddress?.line1 || !shippingAddress?.city) {
      return res.status(400).json({ message: 'Shipping address required' });
    }

    const { subOrders, subtotal } = await buildSubOrdersFromCart(req.user._id);
    if (!subOrders.length) return res.status(400).json({ message: 'Cart is empty or no valid items' });

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

    const order = await prisma.order.create({
      data: {
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
        suborders: {
          create: subOrders.map((so) => ({
            vendorId: so.vendor,
            subtotal: so.subtotal,
            commissionTotal: so.commissionTotal,
            vendorPayoutTotal: so.vendorPayoutTotal,
            status: 'pending',
            lines: {
              create: so.items.map((item) => ({
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
              })),
            },
          })),
        },
      },
    });

    if (!stripe) {
      await finalizeOrderPayment(order.id, coupon?.id ?? null, req.user._id, { provider: 'manual' });
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
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Checkout failed' });
  }
});

async function finalizeOrderPayment(orderId, couponId, userId, opts = {}) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { suborders: { include: { lines: true } } },
    });
    if (!order) throw new Error('Order not found');

    for (const sub of order.suborders) {
      for (const line of sub.lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
    }

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usesCount: { increment: 1 } },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        paymentProvider: opts.provider || 'stripe',
      },
    });

    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    await tx.notification.create({
      data: {
        userId,
        title: 'Order placed',
        body: `Order ${order.orderNumber} confirmed.`,
        type: 'order',
        meta: { orderId },
      },
    });

    const vendorIds = [...new Set(order.suborders.map((s) => s.vendorId))];
    for (const vid of vendorIds) {
      const v = await tx.vendor.findUnique({ where: { id: vid } });
      if (v?.userId) {
        await tx.notification.create({
          data: {
            userId: v.userId,
            title: 'New order',
            body: `Order ${order.orderNumber} includes your products.`,
            type: 'order',
            meta: { orderId },
          },
        });
      }
    }
  });
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

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user._id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (order.status === 'paid') {
      const full = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          user: { select: { name: true, email: true } },
          suborders: { include: { lines: true } },
        },
      });
      return res.json({ order: formatOrderResponse(full), alreadyPaid: true });
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    let couponId = null;
    if (order.couponCode) {
      const c = await prisma.coupon.findUnique({ where: { code: order.couponCode } });
      couponId = c?.id ?? null;
    }

    await finalizeOrderPayment(order.id, couponId, order.userId, { provider: 'stripe' });

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: { select: { name: true, email: true } },
        suborders: { include: { lines: true } },
      },
    });
    res.json({ order: formatOrderResponse(updated) });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || 'Verification failed' });
  }
});

export { finalizeOrderPayment };

export default router;
