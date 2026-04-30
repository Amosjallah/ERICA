"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [shipping, setShipping] = useState({
    name: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ url?: string; demo?: boolean }>("/checkout/create-session", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: shipping,
          couponCode: coupon || undefined,
        }),
        token,
      });
      if (res.url) {
        window.location.href = res.url;
      } else {
        toast.error("Could not start checkout");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p className="px-4 py-12 text-center">Please sign in to checkout.</p>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Without a Stripe test key, the API completes orders in demo mode (no card required).
      </p>
      <form onSubmit={pay} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium">Full name</label>
          <input
            required
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={shipping.name}
            onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium">Address line 1</label>
          <input
            required
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={shipping.line1}
            onChange={(e) => setShipping({ ...shipping, line1: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">City</label>
            <input
              required
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={shipping.city}
              onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">State / Region</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={shipping.state}
              onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Postal code</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={shipping.postalCode}
              onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Country</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={shipping.country}
              onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">Coupon code</label>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
        >
          {loading ? "Processing…" : "Pay securely"}
        </button>
      </form>
    </div>
  );
}
