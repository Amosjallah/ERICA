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

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${api}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

export default async function HomePage() {
  let featured: unknown[] = [];
  let categories: { _id: string; name: string; slug: string; description?: string }[] = [];
  try {
    const fp = await fetchJson<{ products: typeof featured }>("/products?featured=true&limit=8");
    featured = fp.products || [];
    categories = await fetchJson<typeof categories>("/categories");
  } catch {
    featured = [];
  }

  return (
    <div>
      <HomeHero />
      <HomeStatsBanner />

      {categories.length > 0 ? (
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
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Hand-picked</p>
            <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Featured picks</h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Rotating spotlight on standout products from our vendors—updated from your catalog when the API is connected.
            </p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-400">
            View all products →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.isArray(featured) &&
            featured.map((p) => (
              <ProductCard key={(p as { _id: string })._id} product={p as never} />
            ))}
        </div>
        {(!featured || featured.length === 0) && (
          <p className="mt-6 text-sm text-zinc-500">
            Start the API and run the seed script to see sample products. See README for setup.
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
