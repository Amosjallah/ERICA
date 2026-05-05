"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { SITE_NAME_SHORT } from "@/lib/site";
import { STOCK_IMAGES } from "@/lib/stock-images";

type OrderRow = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<OrderRow[]>("/orders/my", { token })
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Sign in to see your orders.</p>
        <Link href="/?auth=login" className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-amber-600">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">Orders</span>
      </nav>
      <h1 className="font-serif mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">Your orders</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Purchases on {SITE_NAME_SHORT} — tap an order for line items and vendor split.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="relative h-44 w-full max-w-sm overflow-hidden rounded-xl">
            <Image src={STOCK_IMAGES.ordersEmpty} alt="" fill className="object-cover" sizes="384px" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No orders yet. Browse the marketplace to get started.</p>
          <Link href="/marketplace" className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
            Go to marketplace
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => (
            <li key={o._id}>
              <Link
                href={`/orders/${o._id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm transition hover:border-amber-500/40 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{o.orderNumber}</p>
                  <p className="text-xs text-zinc-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {o.status.replace(/_/g, " ")}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-white">${Number(o.total).toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
