"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { SITE_NAME_SHORT } from "@/lib/site";

export type DeliveryForm = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  deliveryNotes: string;
};

const emptyDelivery: DeliveryForm = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: "",
  deliveryNotes: "",
};

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const [coupon, setCoupon] = useState("");
  const [shipping, setShipping] = useState<DeliveryForm>(emptyDelivery);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setShipping((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
    }));
  }, [user]);

  const setField = (key: keyof DeliveryForm, value: string) => {
    setShipping((s) => ({ ...s, [key]: value }));
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ url?: string; demo?: boolean }>("/checkout/create-session", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: shipping,
          couponCode: coupon.trim() || undefined,
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Checkout</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Secure payment via Stripe on {SITE_NAME_SHORT}. Add delivery details so vendors can ship or hand off on campus.
      </p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Without a Stripe test key, the API completes orders in demo mode (no card required).
      </p>

      <form onSubmit={pay} className="mt-10 space-y-10">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-white">Delivery information</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            We share this address with sellers for fulfillment. Use a number you can answer during delivery hours.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="ship-name" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Full name (recipient) <span className="text-red-600">*</span>
              </label>
              <input
                id="ship-name"
                required
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                value={shipping.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="As it should appear on the package"
              />
            </div>
            <div>
              <label htmlFor="ship-phone" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Mobile phone <span className="text-red-600">*</span>
              </label>
              <input
                id="ship-phone"
                required
                type="tel"
                autoComplete="tel"
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                value={shipping.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+233 … or local number"
              />
            </div>
            <div>
              <label htmlFor="ship-line1" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Street address <span className="text-red-600">*</span>
              </label>
              <input
                id="ship-line1"
                required
                autoComplete="address-line1"
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                value={shipping.line1}
                onChange={(e) => setField("line1", e.target.value)}
                placeholder="House number, street, hall or building"
              />
            </div>
            <div>
              <label htmlFor="ship-line2" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Apartment, suite, floor (optional)
              </label>
              <input
                id="ship-line2"
                autoComplete="address-line2"
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                value={shipping.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ship-city" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  City / town <span className="text-red-600">*</span>
                </label>
                <input
                  id="ship-city"
                  required
                  autoComplete="address-level2"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={shipping.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ship-state" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  State / region
                </label>
                <input
                  id="ship-state"
                  autoComplete="address-level1"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={shipping.state}
                  onChange={(e) => setField("state", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ship-postal" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Postal / ZIP code <span className="text-red-600">*</span>
                </label>
                <input
                  id="ship-postal"
                  required
                  autoComplete="postal-code"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={shipping.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ship-country" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Country <span className="text-red-600">*</span>
                </label>
                <input
                  id="ship-country"
                  required
                  autoComplete="country-name"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={shipping.country}
                  onChange={(e) => setField("country", e.target.value)}
                  placeholder="e.g. Ghana"
                />
              </div>
            </div>
            <div>
              <label htmlFor="ship-notes" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Delivery notes (optional)
              </label>
              <textarea
                id="ship-notes"
                rows={3}
                maxLength={2000}
                className="mt-1 w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                value={shipping.deliveryNotes}
                onChange={(e) => setField("deliveryNotes", e.target.value)}
                placeholder="Gate code, preferred time, campus pickup point, landmarks…"
              />
              <p className="mt-1 text-xs text-zinc-400">{shipping.deliveryNotes.length}/2000</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-white">Coupon</h2>
          <div className="mt-4">
            <label htmlFor="coupon" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Code (optional)
            </label>
            <input
              id="coupon"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm uppercase dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="SAVE10"
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-amber-100 shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950 dark:hover:bg-amber-500"
        >
          {loading ? "Processing…" : "Continue to payment"}
        </button>
      </form>
    </div>
  );
}
