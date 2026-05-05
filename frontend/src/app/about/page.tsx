import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_NAME_SHORT } from "@/lib/site";
import { STOCK_IMAGES } from "@/lib/stock-images";

export const metadata: Metadata = {
  title: "About us",
  description: `Learn about ${SITE_NAME_SHORT} — our mission, values, and how we support campus commerce.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">About</p>
      <h1 className="font-serif mt-2 text-4xl font-semibold text-zinc-900 dark:text-white">About {SITE_NAME}</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        {SITE_NAME_SHORT} is a campus-focused multi-vendor marketplace built to connect students, staff, and local sellers in one
        trusted platform.
      </p>

      <div className="relative mt-10 h-48 w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm sm:h-56 md:h-64 dark:border-zinc-800">
        <img
          src={STOCK_IMAGES.aboutMission}
          alt="Campus marketplace hero"
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={1200}
          height={400}
          fetchPriority="high"
        />
      </div>

      <section className="mt-14 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Our mission</h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          We make it easy to discover shops, compare products, and checkout securely—while giving vendors simple tools to list
          inventory, fulfill orders, and grow their audience without losing their brand identity.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">What we offer</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Unified marketplace", "Browse many vendors with one cart and structured sub-orders per shop."],
            ["Secure payments", "Stripe-ready checkout with demo mode when keys are not configured."],
            ["Vendor tools", "Dashboards for sellers and admins with approvals, messaging, and analytics."],
            ["Community trust", "Reviews, wishlists, and notifications so shoppers stay informed."],
          ].map(([title, body], idx) => (
            <li key={idx} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-semibold text-zinc-900 dark:text-white">{title}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50/80 to-sky-50/40 p-8 dark:border-zinc-800 dark:from-amber-950/30 dark:to-sky-950/20">
        <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">Governance & approvals</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          New vendor shops go through an admin review before they appear publicly. This helps keep listings legitimate and protects
          buyers on campus.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Where to next</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-neutral-950"
          >
            Browse marketplace
          </Link>
          <Link href="/shops" className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-600">
            View all shops
          </Link>
          <Link href="/contact" className="rounded-lg px-5 py-2.5 text-sm font-semibold text-amber-800 hover:underline dark:text-amber-400">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
