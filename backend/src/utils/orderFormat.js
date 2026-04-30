import { toLegacy } from './legacy.js';

/** Normalize Supabase embedded keys to the shape formatOrderResponse expects. */
export function normalizeOrder(order) {
  if (!order) return null;
  const user = order.user ?? order.User ?? null;
  const rawSubs = order.suborders ?? order.OrderSuborder ?? [];
  const suborders = rawSubs.map((sub) => {
    const { OrderLineItem, lines, ...subRest } = sub;
    return {
      ...subRest,
      lines: lines ?? OrderLineItem ?? [],
    };
  });
  const { User: _U, OrderSuborder: _OS, suborders: _oldSubs, user: _u, ...rest } = order;
  return { ...rest, user, suborders };
}

/** Shape order + nested suborders/lines like the legacy Order document. */
export function formatOrderResponse(order) {
  order = normalizeOrder(order);
  if (!order) return null;
  const subOrders = (order.suborders || []).map((sub) => ({
    vendor: sub.vendorId,
    items: (sub.lines || []).map((line) => ({
      product: line.productId,
      vendor: line.vendorId,
      title: line.title,
      image: line.image,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      commissionPercent: line.commissionPercent,
      commissionAmount: line.commissionAmount,
      vendorPayout: line.vendorPayout,
    })),
    subtotal: sub.subtotal,
    commissionTotal: sub.commissionTotal,
    vendorPayoutTotal: sub.vendorPayoutTotal,
    status: sub.status,
  }));

  const { suborders, userId, user, ...rest } = order;
  const base = {
    ...rest,
    user: user || order.user,
    userId,
    subOrders,
  };
  return toLegacy(base);
}
