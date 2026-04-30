import { toLegacy } from './legacy.js';

/** Shape Prisma order + nested suborders/lines like the old Mongoose Order document. */
export function formatOrderResponse(order) {
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
