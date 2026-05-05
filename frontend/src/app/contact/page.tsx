import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SUPPORT_EMAIL, SITE_NAME_SHORT } from "@/lib/site";
import { STOCK_IMAGES } from "@/lib/stock-images";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE_NAME_SHORT} — support, vendors, and partnerships.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <section>
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Contact</p>
        <h1 className="font-serif mt-2 text-4xl font-semibold text-zinc-900 dark:text-white">We are here to help</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Reach the {SITE_NAME_SHORT} team for support, partnerships, vendor onboarding questions, or press. We typically reply within
          1–2 business days.
        </p>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800 lg:order-2">
          <Image
            src={STOCK_IMAGES.contactHero}
            alt="Support and workspace"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:order-1 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Email</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Best for orders, account issues, and general inquiries.</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Phone</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Campus support line (demo placeholder).</p>
            <p className="mt-4 font-mono text-sm text-zinc-800 dark:text-zinc-200">+233 (0) 555 010 900</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Hours</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Monday–Friday, 9:00–18:00 local time.</p>
            <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">Emergency escalations: email with “URGENT” in the subject.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Campus desk</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Visit during orientation weeks for in-person vendor sign-up help (schedule varies by semester).
            </p>
            <p className="mt-4 text-sm italic text-zinc-500">Location TBA — check university bulletin.</p>
          </div>
        </div>
      </section>

      <section className="mt-14 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Who to contact</h2>
        <div className="mt-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            <strong className="text-zinc-900 dark:text-white">Shoppers:</strong> order status, refunds, and product issues — email
            with your order number.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Vendors:</strong> store approval, payouts, and dashboard access —
            same inbox; include your shop name.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Partners:</strong> integrations, campus collaborations, and press —
            use email with “Partnership” in the subject.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Common questions</h2>
        <dl className="mt-6 space-y-4">
          {[
            {
              q: "The site says it cannot reach the API when I register.",
              a: "Run the backend (`cd backend && npm run dev`), set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if your API is not on port 5000, and ensure `CLIENT_URL` in `backend/.env` matches your frontend origin (e.g. http://localhost:3000).",
            },
            {
              q: "How long does vendor approval take?",
              a: "Usually 1–3 business days after you submit complete store details. Admins review from the dashboard.",
            },
            {
              q: "Can I sell outside campus?",
              a: "Policies depend on your institution and category; contact us if you need clarification on restricted items.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <dt className="font-semibold text-zinc-900 dark:text-white">{item.q}</dt>
              <dd className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-r from-amber-600/15 via-zinc-100 to-sky-600/15 p-8 dark:from-amber-900/20 dark:via-zinc-900 dark:to-sky-900/20">
        <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">Still stuck?</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Browse the marketplace, read about us, or open the shops directory while you wait for a reply.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/marketplace" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-amber-100 dark:bg-amber-500 dark:text-neutral-950">
            Marketplace
          </Link>
          <Link href="/about" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-600">
            About us
          </Link>
          <Link href="/shops" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-600">
            Shops
          </Link>
        </div>
      </section>
    </div>
  );
}
