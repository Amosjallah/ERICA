"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { STOCK_IMAGES } from "@/lib/stock-images";

type OrderRow = {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string };
};

export default function VendorOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<OrderRow[]>("/orders/vendor", { token }).then(setOrders).catch(() => setOrders([]));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Orders</h1>
      <p className="mt-1 text-sm text-zinc-500">Orders that include your products.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {o.user?.name || "—"}
                  <div className="text-xs text-zinc-400">{o.user?.email}</div>
                </td>
                <td className="px-4 py-3">${o.total.toFixed(2)}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3 text-zinc-500">{new Date(o.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/vendor/orders/${o._id}`} className="text-amber-700 hover:underline dark:text-amber-400">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-10">
            <div className="relative h-36 w-full max-w-xs overflow-hidden rounded-xl">
              <Image src={STOCK_IMAGES.vendorOrdersEmpty} alt="" fill className="object-cover" sizes="320px" />
            </div>
            <p className="text-sm text-zinc-500">No orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
