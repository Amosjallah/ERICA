"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, apiForm, getPublicOrigin } from "@/lib/api";
import { toast } from "sonner";

type Product = {
  _id: string;
  title: string;
  price: number;
  stock: number;
  active: boolean;
  description: string;
  images?: string[];
  category?: { _id: string; name?: string };
};

export default function VendorEditProductPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { token } = useAuth();
  const base = getPublicOrigin();

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(() => {
    if (!token || !id) return;
    apiFetch<Product>(`/products/by-id/${encodeURIComponent(id)}`, { token })
      .then((p) => {
        setTitle(p.title);
        setPrice(String(p.price));
        setStock(String(p.stock));
        setCategory(p.category?._id || "");
        setDescription(p.description || "");
        setActive(!!p.active);
        setImages(p.images || []);
      })
      .catch(() => toast.error("Could not load product"));
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ _id: string; name: string }[]>("/categories", { token }).then(setCategories).catch(() => {});
  }, [token]);

  const saveJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await apiFetch(`/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          price: Number(price),
          stock: Number(stock),
          category,
          description,
          active,
        }),
        token,
      });
      toast.success("Product updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const addImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file) {
      toast.error("Choose an image");
      return;
    }
    const fd = new FormData();
    fd.append("images", file);
    try {
      await apiForm(`/products/${encodeURIComponent(id)}`, fd, token, { method: "PATCH" });
      toast.success("Image added");
      setFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <Link href="/dashboard/vendor/products" className="text-sm text-amber-700 hover:underline dark:text-amber-400">
        ← Back to products
      </Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold">Edit product</h1>

      <form onSubmit={saveJson} className="mt-6 max-w-xl space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <div className="flex gap-2">
          <input
            required
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active (visible in store)
        </label>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-neutral-950">
          Save changes
        </button>
      </form>

      <div className="mt-8 max-w-xl">
        <h2 className="text-sm font-semibold">Images</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((src) => (
            <Image
              key={src}
              src={`${base}${src}`}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-lg border object-cover dark:border-zinc-700"
            />
          ))}
        </div>
        <form onSubmit={addImages} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <button type="submit" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
            Add image
          </button>
        </form>
      </div>
    </div>
  );
}
