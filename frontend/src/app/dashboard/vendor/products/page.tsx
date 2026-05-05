"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch, apiForm, getPublicOrigin } from "@/lib/api";
import { productImageUnoptimized } from "@/lib/image-url";
import { toast } from "sonner";

type Product = {
  _id: string;
  title: string;
  price: number;
  stock: number;
  active: boolean;
  slug: string;
  images?: string[];
  category?: { name?: string };
};

export default function VendorProductsPage() {
  const { token } = useAuth();
  const origin = getPublicOrigin();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (activeFilter === "true" || activeFilter === "false") params.set("active", activeFilter);
    const qs = params.toString();
    apiFetch<{ products: Product[] }>(`/products/mine${qs ? `?${qs}` : ""}`, { token })
      .then((r) => setProducts(r.products || []))
      .catch(() => setProducts([]));
  }, [token, q, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ _id: string; name: string }[]>("/categories", { token }).then(setCategories).catch(() => {});
  }, [token]);

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
      setDescription("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE", token });
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Products</h1>
      <p className="mt-1 text-sm text-zinc-500">Manage catalog, images, and stock.</p>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Add new product</h2>
        <form onSubmit={addProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <input
              required
              type="number"
              step="0.01"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-24 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="sm:col-span-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-neutral-950 sm:col-span-2"
          >
            Publish product
          </button>
        </form>
      </section>

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-zinc-500">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title…"
            className="mt-1 block rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Status</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="mt-1 block rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button type="button" onClick={() => load()} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
          Apply
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 w-16" />
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {products.map((p) => {
              const img = p.images?.[0];
              const thumb = img ? `${origin}${img}` : "/placeholder-product.svg";
              return (
              <tr key={p._id}>
                <td className="px-4 py-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized={productImageUnoptimized(thumb)}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-zinc-500">{p.category?.name || "—"}</td>
                <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">{p.active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/vendor/products/${p._id}`} className="text-amber-700 hover:underline dark:text-amber-400">
                    Edit
                  </Link>
                  <button type="button" onClick={() => remove(p._id)} className="ml-3 text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="px-4 py-8 text-center text-sm text-zinc-500">No products match.</p>}
      </div>
    </div>
  );
}
