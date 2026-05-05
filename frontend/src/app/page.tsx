import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import {
  HOME_CATEGORY_IMAGES,
  HomeEditorial,
  HomeExploreFallback,
  HomeFeatures,
  HomeHero,
  HomeHowItWorks,
  HomeNewsletter,
  HomeStatsBanner,
  HomeTestimonials,
  HomeVendorCta,
} from "@/components/home-sections";
import { getApiBase } from "@/lib/api";
import { fetchApiOk } from "@/lib/server-fetch";

export default async function HomePage() {
  const api = getApiBase();
  /** Newest active products from approved vendors (not only `featured` — uploads show here). */
  let showcase: unknown[] = [];
  let categories: { _id: string; name: string; slug: string; description?: string }[] = [];

  const productsRes = await fetchApiOk(`${api}/products?limit=8&sort=newest`, { next: { revalidate: 30 } });
  if (productsRes?.ok) {
    try {
      const body = (await productsRes.json()) as { products?: unknown };
      showcase = Array.isArray(body.products) ? body.products : [];
    } catch {
      showcase = [];
    }
  }

  const catRes = await fetchApiOk(`${api}/categories`, { next: { revalidate: 30 } });
  if (catRes?.ok) {
    try {
      const raw = await catRes.json();
      categories = Array.isArray(raw) ? raw : [];
    } catch {
      categories = [];
    }
  }

  return (
    <div>
      <HomeHero />
      <HomeStatsBanner />

      {Array.isArray(categories) && categories.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Categories</p>
            <h2 className="font-serif mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">Shop by category</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Jump straight into the aisles that match your mood—each card links to filtered marketplace results.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((c, i) => (
              <Link
                key={c._id}
                href={`/marketplace?category=${encodeURIComponent(c.slug)}`}
                className="group relative min-h-[168px] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm transition hover:border-amber-500/50 hover:shadow-md dark:border-zinc-800"
              >
                <Image
                  src={HOME_CATEGORY_IMAGES[i % HOME_CATEGORY_IMAGES.length]}
                  alt={`${c.name} category`}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-950/10" />
                <div className="relative flex h-full min-h-[168px] flex-col justify-end p-5">
                  <p className="font-serif text-lg font-semibold text-white">{c.name}</p>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-200/90">{c.description}</p>
                  )}
                  <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Browse →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <HomeExploreFallback />
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Just listed</p>
            <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Latest from vendors</h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              New uploads and catalog updates from approved shops—newest listings first.
            </p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-400">
            View all products →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.isArray(showcase) &&
            showcase.map((p) => (
              <ProductCard key={(p as { _id: string })._id} product={p as never} />
            ))}
        </div>
        {(!showcase || showcase.length === 0) && (
          <p className="mt-6 text-sm text-zinc-500">
            No active products yet. When vendors add listings (and are approved), they appear here automatically.
          </p>
        )}
      </section>

      <HomeFeatures />
      <HomeHowItWorks />
      <HomeEditorial />
      <HomeTestimonials />
      <HomeVendorCta />
      <HomeNewsletter />
    </div>
  );
}
