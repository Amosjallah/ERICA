import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getApiBase, getPublicOrigin } from "@/lib/api";
import { isLoopbackImageUrl } from "@/lib/image-url";
import { fetchApiOk } from "@/lib/server-fetch";
import { SITE_NAME, SITE_NAME_SHORT } from "@/lib/site";
import { SiteLogoMark } from "@/components/site-logo";

export const metadata: Metadata = {
  title: "Shops & marketplaces",
  description: `${SITE_NAME_SHORT} vendor directory and curated links to major global e-commerce platforms.`,
};

/** Always load approved shops at request time so the list is not baked empty at build when the API is down. */
export const dynamic = "force-dynamic";

export type RegisteredStore = {
  _id: string;
  storeName: string;
  slug: string;
  description?: string;
  logo?: string | null;
  banner?: string | null;
  user?: { name?: string };
};

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
  const api = getApiBase();
  const res = await fetchApiOk(`${api}/vendors/stores`, { cache: "no-store" });
  if (!res?.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as RegisteredStore[]) : [];
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
      {/* Hero — gold → sky gradient aligned with brand */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.25),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-sky-500/15" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="flex flex-wrap items-start gap-6">
            <SiteLogoMark size={88} className="shrink-0 shadow-lg shadow-amber-900/20 ring-2 ring-amber-500/30" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400/90">Directory</p>
              <h1 className="font-serif mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Shops & marketplaces
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
                Every approved vendor on <span className="text-zinc-200">{SITE_NAME_SHORT}</span>, plus hand-picked links to
                global retailers for comparison—without leaving campus context.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-900/40 transition hover:from-amber-400 hover:to-amber-500"
                >
                  Browse products
                </Link>
                <Link
                  href="/?auth=register"
                  className="rounded-xl border border-zinc-600 bg-zinc-900/80 px-6 py-3 text-sm font-semibold text-zinc-100 backdrop-blur transition hover:border-amber-500/50 hover:bg-zinc-800"
                >
                  Register your shop
                </Link>
                <Link href="/" className="rounded-xl px-6 py-3 text-sm font-medium text-zinc-400 hover:text-amber-400">
                  ← {SITE_NAME} home
                </Link>
                <Link href="/about" className="rounded-xl px-6 py-3 text-sm font-medium text-zinc-400 hover:text-sky-400">
                  About us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-b border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3">
          {[
            [`${stores.length}`, "Approved shops", "On-platform vendors"],
            ["12+", "Partner links", "Major global sites"],
            ["1 cart", "Checkout", "Split orders per vendor"],
          ].map(([n, t, s]) => (
            <div key={t} className="text-center sm:text-left">
              <p className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">{n}</p>
              <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-400">{t}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why use this directory */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Why use this page?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Campus-first", "Stores listed here are tied to our marketplace — messaging and orders stay in one ecosystem."],
            ["Transparency", "Compare against large retailers via external links; we are not affiliated with those brands."],
            ["Growth", "Vendors gain visibility when admins approve their storefront."],
          ].map(([title, body], idx) => (
            <div key={idx} className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registered shops */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:pb-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Shops on {SITE_NAME}</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              Approved vendor storefronts. Select a card to open products, reviews, and messaging from your dashboard.
            </p>
          </div>
          <p className="text-sm font-medium text-zinc-500">{stores.length} shop{stores.length === 1 ? "" : "s"}</p>
        </div>

        {stores.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-amber-500/40 bg-gradient-to-b from-zinc-50 to-white p-10 text-center dark:border-amber-900/40 dark:from-zinc-900 dark:to-zinc-950">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">No approved shops yet.</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Vendors appear here once registered and approved by an admin.
            </p>
            <div className="mt-6 rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-semibold">Seeing empty lists everywhere?</p>
              <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
                Ensure the API is running (`npm run dev` in `backend`), `NEXT_PUBLIC_API_URL` points at it in `frontend/.env.local`,
                and `CLIENT_URL` in `backend/.env` matches your browser origin (e.g. <code className="rounded bg-black/10 px-1">http://localhost:3000</code>
                ).
              </p>
            </div>
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
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-amber-100 via-zinc-100 to-sky-100 dark:from-amber-950/40 dark:via-zinc-900 dark:to-sky-950/40">
                      {banner ? (
                        <Image
                          src={banner}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width:768px) 100vw, 33vw"
                          unoptimized={isLoopbackImageUrl(banner)}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-end gap-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white text-lg font-bold text-amber-800 shadow-md dark:border-zinc-900 dark:bg-zinc-800 dark:text-amber-400">
                          {logo ? (
                            <Image
                              src={logo}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                              unoptimized={isLoopbackImageUrl(logo)}
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

      {/* External marketplaces */}
      <section className="border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-14 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Other popular e-commerce sites</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Educational references — links open in a new tab.{` `}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{SITE_NAME_SHORT} is not affiliated with these brands.</span>
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PARTNER_MARKETPLACES.map((p) => (
              <li key={p.domain}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-sky-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-r from-amber-600/90 via-amber-700 to-sky-800 p-8 text-white shadow-xl dark:border-zinc-700">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <h3 className="font-serif relative text-2xl font-semibold">Sell on {SITE_NAME_SHORT}</h3>
          <p className="relative mt-2 max-w-xl text-sm text-amber-50/95">
            Create a vendor account, pass admin review, and show up in this directory plus the main marketplace search.
          </p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link
              href="/?auth=register"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 shadow hover:bg-zinc-100"
            >
              Get started
            </Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
