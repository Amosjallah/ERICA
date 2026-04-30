export function getCommissionPercent(vendorDoc) {
  if (vendorDoc?.commissionOverridePercent != null)
    return Math.min(100, Math.max(0, vendorDoc.commissionOverridePercent));
  const p = Number(process.env.PLATFORM_COMMISSION_PERCENT);
  return Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 10;
}
