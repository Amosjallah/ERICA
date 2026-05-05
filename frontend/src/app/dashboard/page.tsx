"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { SITE_NAME_SHORT } from "@/lib/site";
import { STOCK_IMAGES } from "@/lib/stock-images";

type Order = {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
};

export default function CustomerDashboard() {
  const { user, token, vendor } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Order[]>("/orders/my", { token }).then(setOrders).catch(() => setOrders([]));
  }, [token]);

  if (!user) {
    return <p className="px-4 py-12 text-center">Please sign in.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Account</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your profile on {SITE_NAME_SHORT}.</p>
      <p className="mt-2 text-sm text-zinc-500">
        Signed in as {user.email} · role: {user.role}
      </p>

      <div className="relative mt-8 aspect-[2/1] max-h-48 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <Image
          src={STOCK_IMAGES.accountWelcome}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {user.role === "vendor" && (
          <Link
            href="/dashboard/vendor"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Vendor dashboard
          </Link>
        )}
        {user.role === "admin" && (
          <Link
            href="/dashboard/admin"
            className="rounded-lg border border-amber-600/50 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-300"
          >
            Admin
          </Link>
        )}
        <Link
          href="/dashboard/messages"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Messages
        </Link>
        <Link
          href="/wishlist"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Wishlist
        </Link>
      </div>
      {user.role === "vendor" && vendor && (
        <p className="mt-4 text-sm text-amber-800 dark:text-amber-300">
          Vendor status: {vendor.approvalStatus}
        </p>
      )}

      <h2 className="mt-10 text-lg font-semibold">Order history</h2>
      <ul className="mt-4 space-y-3">
        {orders.map((o) => (
          <li
            key={o._id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
          >
            <span className="font-medium">{o.orderNumber}</span>
            <span className="text-zinc-500">{o.status}</span>
            <span>${o.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      {orders.length === 0 && <p className="mt-4 text-sm text-zinc-500">No orders yet.</p>}
    </div>
  );
}
