"use client";

import { Suspense } from "react";
import CheckoutSuccessInner from "./checkout-success-inner";

export default function Page() {
  return (
    <Suspense fallback={<p className="py-20 text-center">Loading…</p>}>
      <CheckoutSuccessInner />
    </Suspense>
  );
}
