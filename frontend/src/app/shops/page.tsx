import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicOrigin } from "@/lib/api";
import { SITE_NAME, SITE_NAME_SHORT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shops & marketplaces",
  description: `${SITE_NAME_SHORT} vendor directory and curated links to major global e-commerce platforms.`,
};

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type RegisteredStore = {
  _id: string;
  storeName: string;
  slug: string;
  description?: string;
  logo?: string | null;
  banner?: string | null;
  user?: { name?: string };
};

/** Well-known external marketplaces (not affiliated — educational directory). */
const PARTNER_MARKETPLACES = [
  { name: "Temu", tag: "Deals & variety", url: "https://www.temu.com", domain: "temu.com" },
  { name: "Shopify", tag: "Build your store", url: "https://www.shopify.com", domain: "shopify.com" },
  { name: "Jumia", tag: "Pan-African retail", url: "https://www.jumia.com.gh", domain: "jumia.com.gh" },
  { name: "Amazon", tag: "Global marketplace", url: "https://www.amazon.com", domain: "amazon.com" },
  { name: "AliExpress", tag: "International sellers", url: "https://www.aliexpress.com", domain: "aliexpress.com" },
  { name: "eBay", tag: "Auctions & buy-it-now", url: "https://www.ebay.com", domain: "ebay.com" },
  { name: "Etsy", tag: "Handmade & vintage", url: "https://www.etsy.com", domain: "etsy.com" },
  { name: "Konga", tag: "Nigeria online retail", url: "https://www.konga.com", domain: "konga.com" },
  { name: "Takealot", tag: "South Africa", url: "https://www.takealot.com", domain: "takealot.com" },
  { name: "Flipkart", tag: "India marketplace", url: "https://www.flipkart.com", domain: "flipkart.com" },
  { name: "Lazada", tag: "Southeast Asia", url: "https://www.lazada.com", domain: "lazada.com" },
  { name: "Mercado Libre", tag: "Latin America", url: "https://www.mercadolibre.com", domain: "mercadolibre.com" },
] as const;

async function fetchStores(): Promise<RegisteredStore[]> {
  try {
    const res = await fetch(`${api}/vendors/stores`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as RegisteredStore[]) : [];
  } catch {
    return [];
  }
}

function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${getPublicOrigin()}${path}`;
}

export default async function ShopsPage() {
  const stores = await fetchStores();

  return (
    <div>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Directory</p>
          <h1 className="font-serif mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Shops & marketplaces
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Every vendor storefront registered on {SITE_NAME_SHORT}, plus a curated list of major global e-commerce sites for
            comparison and inspiration.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
            >
              Browse products
            </Link>
            <Link
              href="/?auth=register"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 dark:border-zinc-600 dark:text-white"
            >
              Register your shop
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Shops on {SITE_NAME}</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Approved vendor storefronts hosted on this platform. Visit a shop to see its catalog and message the seller from
              your dashboard.
            </p>
          </div>
          <p className="text-sm font-medium text-zinc-500">{stores.length} shop{stores.length === 1 ? "" : "s"}</p>
        </div>

        {stores.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-zinc-700 dark:text-zinc-300">No approved shops yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              When vendors register and are approved by an admin, their stores will appear here automatically.
            </p>
            <Link href="/?auth=register" className="mt-6 inline-block text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
              Open a vendor account →
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => {
              const banner = mediaUrl(s.banner);
              const logo = mediaUrl(s.logo);
              return (
                <li key={s._id}>
                  <Link
                    href={`/vendor/${encodeURIComponent(s.slug)}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-amber-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-amber-100 to-zinc-200 dark:from-amber-900/30 dark:to-zinc-800">
                      {banner ? (
                        <Image
                          src={banner}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width:768px) 100vw, 33vw"
                          unoptimized={banner.startsWith("http://localhost") || banner.startsWith("http://127.0.0.1")}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-end gap-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white text-lg font-bold text-amber-800 shadow-md dark:border-zinc-900 dark:bg-zinc-800 dark:text-amber-400">
                          {logo ? (
                            <Image
                              src={logo}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                              unoptimized={logo.startsWith("http://localhost") || logo.startsWith("http://127.0.0.1")}
                            />
                          ) : (
                            <span aria-hidden>{s.storeName.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 pb-0.5">
                          <p className="truncate font-serif text-lg font-semibold text-white drop-shadow">{s.storeName}</p>
                          {s.user?.name && <p className="truncate text-xs text-zinc-200">Owner: {s.user.name}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {s.description?.trim() || "Visit the storefront to explore products from this vendor."}
                      </p>
                      <span className="mt-4 text-sm font-semibold text-amber-700 group-hover:underline dark:text-amber-400">
                        Enter shop →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-900/40 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Other popular e-commerce sites</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Independent platforms used by millions of shoppers worldwide. Links open in a new tab.{` `}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{SITE_NAME_SHORT} is not affiliated with these brands.</span>
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PARTNER_MARKETPLACES.map((p) => (
              <li key={p.domain}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-amber-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(p.domain)}&sz=64`}
                    width={40}
                    height={40}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-white">{p.name}</p>
                    <p className="truncate text-xs text-zinc-500">{p.tag}</p>
                  </div>
                  <span className="text-zinc-400" aria-hidden>
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">Sell on {SITE_NAME_SHORT}</h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Want your shop listed in the first section? Create a vendor account, submit your store for approval, and start
            listing products. Shoppers find you here and on the marketplace.
          </p>
          <Link
            href="/?auth=register"
            className="mt-6 inline-flex rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
          >
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}
