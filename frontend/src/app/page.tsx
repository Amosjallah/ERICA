import Link from "next/link";
import { ProductCard } from "@/components/product-card";

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
      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl animate-fade-in">
            <p className="text-sm font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Ericah Marketplace
            </p>
            <h1 className="font-serif mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              Discover products from vendors you will love.
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Premium multi-vendor shopping with secure checkout, honest reviews, and stores you can trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marketplace"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-amber-100 shadow-lg transition hover:bg-zinc-800 dark:bg-amber-600 dark:text-zinc-900 dark:hover:bg-amber-500"
              >
                Shop the marketplace
              </Link>
              <Link
                href="/?auth=register"
                className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              >
                Start selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Shop by category</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c._id}
                href={`/marketplace?category=${encodeURIComponent(c.slug)}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-amber-500/50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="font-medium text-zinc-900 dark:text-white">{c.name}</p>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{c.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Featured picks</h2>
          <Link href="/marketplace" className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
            View all
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
    </div>
  );
}
