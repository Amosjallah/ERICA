-- Vendor store & shipping (run in Supabase SQL editor if not already applied)
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "flatShippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "shippingPolicy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "returnPolicy" TEXT NOT NULL DEFAULT '';

-- Vendor-owned coupons (NULL vendorId = platform / admin coupons)
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Coupon_vendorId_fkey'
  ) THEN
    ALTER TABLE "Coupon"
      ADD CONSTRAINT "Coupon_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Coupon_vendorId_idx" ON "Coupon"("vendorId");
