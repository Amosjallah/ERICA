"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Analytics = {
  users: number;
  vendors: number;
  products: number;
  orders: number;
  grossRevenue: number;
  platformCommission: number;
};

type VendorRow = {
  _id: string;
  storeName: string;
  user?: { email?: string };
  approvalStatus: string;
};

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [pending, setPending] = useState<VendorRow[]>([]);

  const load = () => {
    if (!token) return;
    apiFetch<Analytics>("/admin/analytics", { token }).then(setData).catch(() => {});
    apiFetch<VendorRow[]>("/admin/pending-vendors", { token }).then(setPending).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  const approve = async (id: string, status: "approved" | "rejected") => {
    await apiFetch(`/admin/vendors/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ approvalStatus: status }),
      token,
    });
    load();
  };

  if (!user || user.role !== "admin") {
    return <p className="px-4 py-12 text-center">Admin only.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Admin</h1>
      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["users", data.users],
              ["vendors", data.vendors],
              ["products", data.products],
              ["orders", data.orders],
              ["grossRevenue", data.grossRevenue],
              ["platformCommission", data.platformCommission],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{k}</p>
              <p className="text-2xl font-semibold">
                {typeof v === "number" && v % 1 !== 0 ? v.toFixed(2) : v}
              </p>
            </div>
          ))}
        </div>
      )}
      <h2 className="mt-10 text-lg font-semibold">Pending vendors</h2>
      <ul className="mt-4 space-y-3">
        {pending.map((v) => (
          <li
            key={v._id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">{v.storeName}</p>
              <p className="text-xs text-zinc-500">{v.user?.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approve(v._id, "approved")}
                className="rounded bg-emerald-700 px-3 py-1 text-xs text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => approve(v._id, "rejected")}
                className="rounded bg-zinc-200 px-3 py-1 text-xs dark:bg-zinc-700"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
      {pending.length === 0 && <p className="mt-4 text-sm text-zinc-500">No pending vendors.</p>}
    </div>
  );
}
