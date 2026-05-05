import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getApiBase, getPublicOrigin } from "@/lib/api";
import { isLoopbackImageUrl } from "@/lib/image-url";
import { SITE_NAME_SHORT } from "@/lib/site";
import { fetchApiOk } from "@/lib/server-fetch";

export default async function VendorStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const api = getApiBase();
  const res = await fetchApiOk(`${api}/vendors/store/${slug}`, { next: { revalidate: 30 } });
  if (!res?.ok) notFound();
  let data: { vendor?: { storeName?: string; description?: string; banner?: string | null; slug?: string }; products?: unknown[] };
  try {
    data = await res.json();
  } catch {
    notFound();
  }
  const { vendor, products } = data;
  if (!vendor?.storeName) notFound();
  const origin = getPublicOrigin();
  const banner =
    vendor.banner && typeof vendor.banner === "string"
      ? vendor.banner.startsWith("http")
        ? vendor.banner
        : `${origin}${vendor.banner}`
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-amber-600">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/shops" className="hover:text-amber-600">
          Shops
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{vendor.storeName}</span>
      </nav>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {banner ? (
          <div className="relative h-40 w-full sm:h-48">
            <Image
              src={banner}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized={isLoopbackImageUrl(banner)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-300/90">{SITE_NAME_SHORT} vendor</p>
              <h1 className="font-serif text-3xl font-semibold text-white drop-shadow-sm">{vendor.storeName}</h1>
            </div>
          </div>
        ) : (
          <div className="border-b border-zinc-100 bg-gradient-to-r from-amber-50 to-zinc-50 p-8 dark:border-zinc-800 dark:from-amber-950/30 dark:to-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-400">{SITE_NAME_SHORT} vendor</p>
            <h1 className="font-serif mt-1 text-3xl font-semibold text-zinc-900 dark:text-white">{vendor.storeName}</h1>
          </div>
        )}
        {!banner && (
          <div className="px-8 pb-8 pt-0">
            <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{vendor.description}</p>
          </div>
        )}
        {banner && vendor.description && (
          <div className="p-8 pt-4">
            <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{vendor.description}</p>
          </div>
        )}
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(Array.isArray(products) ? products : []).map((p) => (
          <ProductCard key={(p as { _id: string })._id} product={p as never} />
        ))}
      </div>
      {(!Array.isArray(products) || products.length === 0) && (
        <p className="mt-8 text-sm text-zinc-500">This store has no products yet.</p>
      )}
      <p className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/shops" className="text-amber-700 hover:underline dark:text-amber-400">
          ← All shops
        </Link>
        <Link href="/marketplace" className="text-zinc-600 hover:underline dark:text-zinc-400">
          Marketplace
        </Link>
      </p>
    </div>
  );
}
