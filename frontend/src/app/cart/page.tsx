"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { apiFetch, getPublicOrigin } from "@/lib/api";
import { productImageUnoptimized } from "@/lib/image-url";
import { SITE_NAME_SHORT } from "@/lib/site";
import { STOCK_IMAGES } from "@/lib/stock-images";
import Image from "next/image";

type CartItem = {
  quantity: number;
  product: {
    _id: string;
    title: string;
    price: number;
    images?: string[];
    vendor?: { storeName?: string; slug?: string };
  };
};

export default function CartPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }
    apiFetch<{ items: CartItem[] }>("/cart", { token })
      .then((c) => setItems(c.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user, token]);

  useEffect(() => {
    load();
  }, [load]);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const updateQty = async (productId: string, quantity: number) => {
    await apiFetch(`/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
      token,
    });
    load();
  };

  const remove = async (productId: string) => {
    await apiFetch(`/cart/items/${productId}`, { method: "DELETE", token });
    load();
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Sign in to view your cart.</p>
        <Link href="/?auth=login" className="mt-4 inline-block text-amber-700 underline dark:text-amber-400">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="px-4 py-12 text-center text-sm text-zinc-500">Loading cart…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Your cart</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Items from multiple vendors on {SITE_NAME_SHORT} ship as separate sub-orders.</p>
      <div className="mt-8 space-y-4">
        {items.map((line) => {
          const img = line.product.images?.[0];
          const src = img ? `${getPublicOrigin()}${img}` : "/placeholder-product.svg";
          return (
            <div
              key={line.product._id}
              className="flex gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                <Image src={src} alt="" fill className="object-cover" sizes="96px" unoptimized={productImageUnoptimized(src)} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900 dark:text-white">{line.product.title}</p>
                <p className="text-xs text-zinc-500">{line.product.vendor?.storeName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateQty(line.product._id, Number(e.target.value))}
                    className="w-20 rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span className="text-sm font-semibold">
                    ${(line.product.price * line.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(line.product._id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {items.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="relative h-44 w-full max-w-sm overflow-hidden rounded-xl">
            <Image src={STOCK_IMAGES.cartEmpty} alt="" fill className="object-cover" sizes="384px" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Your cart is empty.</p>
          <Link href="/marketplace" className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
            Browse marketplace
          </Link>
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-lg font-semibold">Subtotal: ${subtotal.toFixed(2)}</p>
          <Link
            href="/checkout"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-neutral-950"
          >
            Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
