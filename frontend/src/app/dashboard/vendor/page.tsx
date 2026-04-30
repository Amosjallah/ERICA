"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { apiFetch, apiForm } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { SITE_NAME_SHORT } from "@/lib/site";

type Summary = {
  productCount: number;
  orderCount: number;
  revenue: number;
  approvalStatus: string;
};

export default function VendorDashboard() {
  const { user, token, vendor } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "vendor") return;
    apiFetch<Summary>("/vendors/dashboard/summary", { token }).then(setSummary).catch(() => {});
    apiFetch<{ _id: string; name: string }[]>("/categories", { token })
      .then(setCategories)
      .catch(() => {});
  }, [token, user]);

  if (!user || user.role !== "vendor") {
    return <p className="px-4 py-12">Vendor access only.</p>;
  }

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("title", title);
    form.append("price", price);
    form.append("category", category);
    form.append("stock", stock);
    form.append("description", description);
    if (file) form.append("images", file);
    try {
      await apiForm("/products", form, token);
      toast.success("Product created");
      setTitle("");
      setPrice("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Vendor dashboard</h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Manage your storefront on {SITE_NAME_SHORT}.</p>
      {vendor && (
        <p className="mt-2 text-sm text-zinc-500">
          Store: {vendor.storeName} · {vendor.approvalStatus}
        </p>
      )}
      {vendor?.slug && (
        <p className="mt-1 text-sm">
          <Link href={`/vendor/${vendor.slug}`} className="font-medium text-amber-700 hover:underline dark:text-amber-400">
            View public shop
          </Link>
          <span className="mx-2 text-zinc-300 dark:text-zinc-600">·</span>
          <Link href="/shops" className="text-zinc-600 hover:underline dark:text-zinc-400">
            Shops directory
          </Link>
        </p>
      )}
      {summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Products</p>
            <p className="text-2xl font-semibold">{summary.productCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Orders</p>
            <p className="text-2xl font-semibold">{summary.orderCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Est. payout</p>
            <p className="text-2xl font-semibold">${summary.revenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold">Add product</h2>
      <form onSubmit={addProduct} className="mt-4 space-y-3">
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            type="number"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
        >
          Publish product
        </button>
      </form>
      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="text-amber-700 dark:text-amber-400">
          ← Account
        </Link>
      </p>
    </div>
  );
}
