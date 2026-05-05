"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Tx = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  suborderStatus: string;
  subtotal: number;
  commissionTotal: number;
  vendorPayout: number;
  createdAt: string | null;
};

export default function VendorEarningsPage() {
  const { token } = useAuth();
  const [pending, setPending] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [tx, setTx] = useState<Tx[]>([]);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<{ pendingPayouts: number; completedPayouts: number; transactions: Tx[] }>("/vendors/earnings", { token })
      .then((d) => {
        setPending(d.pendingPayouts);
        setCompleted(d.completedPayouts);
        setTx(d.transactions || []);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Earnings</h1>
      <p className="mt-1 text-sm text-zinc-500">Payouts are derived from your sub-orders after platform commission.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Pending (in-flight orders)</p>
          <p className="mt-1 text-2xl font-semibold text-amber-950 dark:text-amber-100">${pending.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500">Completed (delivered)</p>
          <p className="mt-1 text-2xl font-semibold">${completed.toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Order status</th>
              <th className="px-4 py-3">Your status</th>
              <th className="px-4 py-3">Subtotal</th>
              <th className="px-4 py-3">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tx.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-medium">{t.orderNumber}</td>
                <td className="px-4 py-3 text-zinc-500">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{t.orderStatus}</td>
                <td className="px-4 py-3">{t.suborderStatus}</td>
                <td className="px-4 py-3">${Number(t.subtotal).toFixed(2)}</td>
                <td className="px-4 py-3 font-medium">${Number(t.vendorPayout).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tx.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">No transactions yet.</p>}
      </div>
    </div>
  );
}
