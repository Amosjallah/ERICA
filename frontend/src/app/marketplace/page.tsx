import { ProductCard } from "@/components/product-card";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  qs.set("sort", sort);
  qs.set("limit", "24");

  const res = await fetch(`${api}/products?${qs.toString()}`, { next: { revalidate: 15 } });
  const data = res.ok ? await res.json() : { products: [] };
  const products = data.products || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Sort</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["newest", "Newest"],
              ["price_asc", "Price: low to high"],
              ["price_desc", "Price: high to low"],
              ["rating", "Top rated"],
            ].map(([value, label]) => (
              <li key={value}>
                <a
                  className="text-amber-700 hover:underline dark:text-amber-400"
                  href={`/marketplace?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), sort: value }).toString()}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Marketplace</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {q ? `Results for “${q}”` : "Browse products from approved vendors."}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p: never) => (
              <ProductCard key={(p as { _id: string })._id} product={p as never} />
            ))}
          </div>
          {products.length === 0 && (
            <p className="mt-10 text-sm text-zinc-500">No products match your filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
