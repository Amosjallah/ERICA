"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

type N = { _id: string; title: string; body: string; type: string; read: boolean; createdAt: string; meta?: { orderId?: string } };

export default function VendorNotificationsPage() {
  const { token } = useAuth();
  const [list, setList] = useState<N[]>([]);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<N[]>("/notifications", { token }).then(setList).catch(() => setList([]));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    if (!token) return;
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token }).catch(() => {});
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-zinc-500">New orders, messages, and updates for your account.</p>
      <ul className="mt-6 space-y-2">
        {list.map((n) => (
          <li
            key={n._id}
            className={`rounded-xl border px-4 py-3 text-sm dark:border-zinc-800 ${
              n.read ? "border-zinc-200 bg-white dark:bg-zinc-900" : "border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-300">{n.body}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {n.type} · {new Date(n.createdAt).toLocaleString()}
                </p>
                {n.meta?.orderId && (
                  <Link
                    href={`/dashboard/vendor/orders/${n.meta.orderId}`}
                    className="mt-2 inline-block text-xs font-medium text-amber-700 dark:text-amber-400"
                  >
                    View order
                  </Link>
                )}
              </div>
              {!n.read && (
                <button type="button" onClick={() => markRead(n._id)} className="shrink-0 text-xs text-amber-800 hover:underline dark:text-amber-300">
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-8 text-sm text-zinc-500">No notifications.</p>}
    </div>
  );
}
