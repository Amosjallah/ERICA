"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";

export default function WishlistPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<unknown[]>([]);

  useEffect(() => {
    if (!user || !token) return;
    apiFetch<{ products: unknown[] }>("/wishlist", { token })
      .then((w) => setProducts(w.products || []))
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
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={(p as { _id: string })._id} product={p as never} />
        ))}
      </div>
      {products.length === 0 && <p className="mt-6 text-sm text-zinc-500">Your wishlist is empty.</p>}
    </div>
  );
}
