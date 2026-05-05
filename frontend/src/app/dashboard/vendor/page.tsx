"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { SITE_NAME_SHORT } from "@/lib/site";

type Overview = {
  productCount: number;
  orderCount: number;
  totalSales: number;
  revenue: number;
  approvalStatus: string;
  salesByWeek: { label: string; amount: number }[];
  salesByMonth: { label: string; amount: number }[];
  recentOrders: Record<string, unknown>[];
};

export default function VendorOverviewPage() {
  const { token, vendor } = useAuth();
  const [data, setData] = useState<Overview | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<Overview>("/vendors/dashboard/overview", { token }).then(setData).catch(() => setData(null));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const maxWeek = Math.max(1, ...(data?.salesByWeek.map((d) => d.amount) || [1]));
  const maxMonth = Math.max(1, ...(data?.salesByMonth.map((d) => d.amount) || [1]));

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard Overview</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sales and activity on {SITE_NAME_SHORT}.</p>
      {vendor?.slug && (
        <p className="mt-2 text-sm">
          <Link href={`/vendor/${vendor.slug}`} className="font-medium text-amber-700 hover:underline dark:text-amber-400">
            View public shop
          </Link>
        </p>
      )}

      {data && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total sales", value: `$${data.totalSales.toFixed(2)}`, sub: "Gross subtotal" },
              { label: "Orders", value: String(data.orderCount), sub: "Paid & fulfilled pipeline" },
              { label: "Products", value: String(data.productCount), sub: "Active listings" },
              { label: "Revenue (est.)", value: `$${data.revenue.toFixed(2)}`, sub: "Your payout total" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs font-medium text-zinc-500">{c.label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{c.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sales (last 14 days)</h2>
              <div className="mt-4 flex h-40 items-end gap-1">
                {data.salesByWeek.map((d) => (
                  <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[28px] rounded-t bg-amber-500/80 dark:bg-amber-600"
                      style={{ height: `${Math.max(4, (d.amount / maxWeek) * 100)}%` }}
                      title={`${d.label}: $${d.amount}`}
                    />
                    <span className="max-w-full truncate text-[10px] text-zinc-400">{d.label.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sales by month</h2>
              <div className="mt-4 flex h-40 items-end gap-2">
                {data.salesByMonth.map((d) => (
                  <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-amber-700/70 dark:bg-amber-500/60"
                      style={{ height: `${Math.max(6, (d.amount / maxMonth) * 100)}%` }}
                      title={`${d.label}: $${d.amount}`}
                    />
                    <span className="text-[10px] text-zinc-400">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent orders</h2>
              <Link href="/dashboard/vendor/orders" className="text-xs font-medium text-amber-700 dark:text-amber-400">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data.recentOrders as { _id?: string; orderNumber?: string; total?: number; status?: string }[]).map(
                (o) => (
                  <li key={o._id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium">{o.orderNumber}</span>
                      <span className="ml-2 text-zinc-500">{o.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>${Number(o.total || 0).toFixed(2)}</span>
                      <Link
                        href={`/dashboard/vendor/orders/${o._id}`}
                        className="text-amber-700 hover:underline dark:text-amber-400"
                      >
                        Details
                      </Link>
                    </div>
                  </li>
                )
              )}
            </ul>
            {data.recentOrders.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">No orders yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
