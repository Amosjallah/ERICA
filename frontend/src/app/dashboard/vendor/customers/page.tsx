"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Customer = {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  lastOrderAt: string;
};

export default function VendorCustomersPage() {
  const { token, vendor } = useAuth();
  const [rows, setRows] = useState<Customer[]>([]);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<Customer[]>("/vendors/customers", { token }).then(setRows).catch(() => setRows([]));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Customers</h1>
      <p className="mt-1 text-sm text-zinc-500">People who placed paid orders including your products.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Last order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((c) => (
              <tr key={c.userId}>
                <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{c.email}</td>
                <td className="px-4 py-3">{c.orderCount}</td>
                <td className="px-4 py-3 text-zinc-500">{new Date(c.lastOrderAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {vendor?._id ? (
                    <Link
                      href={`/dashboard/messages?vendor=${encodeURIComponent(vendor._id)}&customer=${encodeURIComponent(c.userId)}`}
                      className="text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Message
                    </Link>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">No customers yet.</p>}
      </div>
      <p className="mt-4 text-xs text-zinc-400">
        Messaging opens the Messages area — start a thread from your store context when supported.
      </p>
    </div>
  );
}
