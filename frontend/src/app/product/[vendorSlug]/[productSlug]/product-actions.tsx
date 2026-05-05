"use client";

import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductActions({
  productId,
  vendorId,
  stock,
}: {
  productId: string;
  vendorId: string;
  stock: number;
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const addCart = async () => {
    if (!user) {
      router.push("/?auth=login");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: qty }),
        token,
      });
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add");
    } finally {
      setLoading(false);
    }
  };

  const addWishlist = async () => {
    if (!user) {
      router.push("/?auth=login");
      return;
    }
    try {
      await apiFetch(`/wishlist/${productId}`, { method: "POST", token });
      toast.success("Saved to wishlist");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div>
        <label className="text-xs font-medium text-zinc-500">Quantity</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, stock)}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(stock, Number(e.target.value))))}
          className="mt-1 w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-1 flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || stock < 1}
          onClick={addCart}
          className="flex-1 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-amber-100 disabled:opacity-50 dark:bg-amber-600 dark:text-neutral-950"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={addWishlist}
          className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium dark:border-zinc-700"
        >
          Wishlist
        </button>
      </div>
      <button
        type="button"
        onClick={() => router.push(`/dashboard/messages?vendor=${vendorId}`)}
        className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
      >
        Message vendor
      </button>
    </div>
  );
}
