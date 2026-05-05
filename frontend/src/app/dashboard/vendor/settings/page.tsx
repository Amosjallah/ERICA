"use client";

import { useAuth } from "@/context/auth-context";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiForm, getPublicOrigin } from "@/lib/api";
import { toast } from "sonner";

type VendorFull = {
  _id: string;
  storeName: string;
  description: string;
  logo?: string;
  banner?: string;
  flatShippingFee?: number;
  shippingPolicy?: string;
  returnPolicy?: string;
};

export default function VendorSettingsPage() {
  const { token, refresh } = useAuth();
  const [v, setV] = useState<VendorFull | null>(null);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [flatShippingFee, setFlatShippingFee] = useState("0");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<VendorFull>("/vendors/me", { token }).then((row) => {
      setV(row);
      setStoreName(row.storeName || "");
      setDescription(row.description || "");
      setFlatShippingFee(String(row.flatShippingFee ?? 0));
      setShippingPolicy(row.shippingPolicy || "");
      setReturnPolicy(row.returnPolicy || "");
    });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const base = getPublicOrigin();

  const saveText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await apiFetch("/vendors/me", {
        method: "PATCH",
        body: JSON.stringify({
          storeName,
          description,
          flatShippingFee: Number(flatShippingFee) || 0,
          shippingPolicy,
          returnPolicy,
        }),
        token,
      });
      toast.success("Store settings saved");
      await refresh();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || (!logo && !banner)) {
      toast.error("Choose a logo and/or banner image");
      return;
    }
    const fd = new FormData();
    if (logo) fd.append("logo", logo);
    if (banner) fd.append("banner", banner);
    try {
      await apiForm("/vendors/me/branding", fd, token);
      toast.success("Images updated");
      setLogo(null);
      setBanner(null);
      await refresh();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">Store settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Store name, branding, shipping fee, and policies.</p>

      <form onSubmit={saveText} className="mt-8 max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Store details</h2>
        <div>
          <label className="text-xs text-zinc-500">Store name</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Flat shipping fee (USD)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={flatShippingFee}
            onChange={(e) => setFlatShippingFee(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <p className="mt-1 text-xs text-zinc-400">Shown for reference; checkout may still use platform shipping.</p>
        </div>
        <div>
          <label className="text-xs text-zinc-500">Shipping policy</label>
          <textarea
            value={shippingPolicy}
            onChange={(e) => setShippingPolicy(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Returns policy</label>
          <textarea
            value={returnPolicy}
            onChange={(e) => setReturnPolicy(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-neutral-950">
          Save details
        </button>
      </form>

      <form onSubmit={saveBranding} className="mt-8 max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Logo & banner</h2>
        {v?.logo && (
          <p className="text-xs text-zinc-500">
            Current logo:{" "}
            <Image
              src={`${base}${v.logo}`}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="mt-1 inline h-12 w-12 rounded-lg object-cover align-top"
            />
          </p>
        )}
        {v?.banner && (
          <p className="text-xs text-zinc-500">
            Current banner:{" "}
            <Image
              src={`${base}${v.banner}`}
              alt=""
              width={320}
              height={80}
              unoptimized
              className="mt-1 h-20 max-w-full rounded-lg object-cover"
            />
          </p>
        )}
        <div>
          <label className="text-xs text-zinc-500">New logo</label>
          <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="mt-1 block text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500">New banner</label>
          <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] || null)} className="mt-1 block text-sm" />
        </div>
        <button type="submit" className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
          Upload branding
        </button>
      </form>
    </div>
  );
}
