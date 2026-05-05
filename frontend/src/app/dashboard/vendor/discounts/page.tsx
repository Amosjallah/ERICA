"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Coupon = {
  _id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  minOrderAmount: number;
  expiresAt: string | null;
  active: boolean;
};

export default function VendorDiscountsPage() {
  const { token } = useAuth();
  const [list, setList] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<Coupon[]>("/vendors/me/coupons", { token }).then(setList).catch(() => setList([]));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await apiFetch("/vendors/me/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          description,
          discountType,
          discountValue: Number(discountValue),
          maxUses: maxUses ? Number(maxUses) : null,
          minOrderAmount: Number(minOrderAmount) || 0,
          expiresAt: expiresAt || null,
        }),
        token,
      });
      toast.success("Coupon created");
      setCode("");
      setDescription("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await apiFetch(`/vendors/me/coupons/${id}`, { method: "DELETE", token });
      toast.success("Removed");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Discounts</h1>
      <p className="mt-1 text-sm text-zinc-500">Coupon codes for your marketing (globally unique code).</p>

      <form onSubmit={create} className="mt-8 max-w-xl space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Create coupon</h2>
        <input
          required
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm uppercase dark:border-zinc-700 dark:bg-zinc-950"
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <div className="flex gap-2">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
          <input
            required
            type="number"
            step="0.01"
            placeholder="Value"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Max uses (empty = unlimited)"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            type="number"
            placeholder="Min order"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Expiry (optional)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-neutral-950">
          Create coupon
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {list.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.discountType}</td>
                <td className="px-4 py-3">{c.discountType === "percent" ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                <td className="px-4 py-3 text-zinc-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{c.active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => remove(c._id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">No coupons yet.</p>}
      </div>
    </div>
  );
}
