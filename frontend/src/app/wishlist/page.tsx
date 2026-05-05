"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { SITE_NAME_SHORT } from "@/lib/site";
import { STOCK_IMAGES } from "@/lib/stock-images";

export default function WishlistPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<unknown[]>([]);

  useEffect(() => {
    if (!user || !token) return;
    apiFetch<{ products?: unknown }>("/wishlist", { token })
      .then((w) => (Array.isArray(w.products) ? w.products : []))
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [user, token]);

  if (!user) {
    return (
      <p className="px-4 py-12 text-center">
        <Link href="/?auth=login" className="text-amber-700 underline">
          Sign in
        </Link>{" "}
        to view your wishlist.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Wishlist</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Saved products on {SITE_NAME_SHORT}.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={(p as { _id: string })._id} product={p as never} />
        ))}
      </div>
      {products.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="relative h-44 w-full max-w-sm overflow-hidden rounded-xl">
            <Image src={STOCK_IMAGES.wishlistEmpty} alt="" fill className="object-cover" sizes="384px" />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Your wishlist is empty.</p>
          <Link href="/marketplace" className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
            Discover products
          </Link>
        </div>
      )}
    </div>
  );
}
