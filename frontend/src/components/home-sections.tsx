import Image from "next/image";
import Link from "next/link";

/** Rotating hero imagery for category cards on the home page when API has no image. */
export const HOME_CATEGORY_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd918d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
] as const;

const img = {
  hero: "https://images.unsplash.com/photo-1441986300917-64674bd918d?q=85&w=1600&auto=format&fit=crop",
  browse: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=85&w=900&auto=format&fit=crop",
  vendor: "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=85&w=900&auto=format&fit=crop",
  delivery: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=85&w=800&auto=format&fit=crop",
  lifestyle: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=900&auto=format&fit=crop",
  craft: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=85&w=900&auto=format&fit=crop",
  tech: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=85&w=800&auto=format&fit=crop",
  avatar1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
  avatar2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  avatar3: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
};

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTruck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 18h2M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
    </svg>
  );
}
function IconCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconStore({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-zinc-400/10 blur-3xl dark:bg-zinc-600/10" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl animate-fade-in">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
            Ericah Marketplace
          </p>
          <h1 className="font-serif mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            Discover products from vendors you will love.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Premium multi-vendor shopping with secure checkout, honest reviews, wishlists, in-app messaging, and stores you can
            trust—all in one place.
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
            <Link
              href="/contact"
              className="rounded-lg px-6 py-3 text-sm font-semibold text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-white"
            >
              Talk to us
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Vendors</dt>
              <dd className="font-serif mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">200+</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Listings</dt>
              <dd className="font-serif mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">5k+</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Categories</dt>
              <dd className="font-serif mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">40+</dd>
            </div>
          </dl>
        </div>
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none animate-fade-in">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-900/10 dark:border-zinc-700 dark:shadow-black/40 sm:aspect-[5/6]">
            <Image src={img.hero} alt="Bright retail store interior with clothing displays" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 text-sm font-medium text-white drop-shadow-md">
              Curated storefronts · Verified vendors · Secure payments
            </p>
          </div>
          <div className="absolute -bottom-6 -left-4 hidden w-44 overflow-hidden rounded-xl border border-zinc-200 shadow-xl dark:border-zinc-700 sm:block">
            <div className="relative aspect-square">
              <Image src={img.delivery} alt="Hands handing over a shopping bag" fill className="object-cover" sizes="176px" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeStatsBanner() {
  const items = [
    { label: "Secure checkout", sub: "Stripe-ready flows" },
    { label: "Order tracking", sub: "Split orders per vendor" },
    { label: "24h support goal", sub: "Dedicated contact page" },
    { label: "Wishlist & alerts", sub: "Save for later in one tap" },
  ];
  return (
    <section className="border-b border-zinc-200 bg-zinc-900 py-10 text-white dark:border-zinc-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center lg:text-left">
            <p className="text-sm font-semibold text-amber-200/90">{item.label}</p>
            <p className="mt-1 text-xs text-zinc-400">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeFeatures() {
  const features = [
    {
      icon: IconStore,
      title: "Multi-vendor marketplace",
      body: "Browse independent shops side by side with unified cart and checkout.",
    },
    {
      icon: IconShield,
      title: "Roles that fit your team",
      body: "Customer, vendor, and admin dashboards with clear permissions.",
    },
    {
      icon: IconCard,
      title: "Payments you can trust",
      body: "Stripe checkout with session verification and graceful demo mode.",
    },
    {
      icon: IconTruck,
      title: "Orders that make sense",
      body: "Sub-orders per vendor so fulfillment and status stay organized.",
    },
    {
      icon: IconChat,
      title: "Messaging built in",
      body: "Message vendors from your dashboard without leaving the app.",
    },
    {
      icon: IconHeart,
      title: "Wishlist & reviews",
      body: "Save favorites and leave reviews that help the community shop smarter.",
    },
    {
      icon: IconBell,
      title: "Notifications",
      body: "Stay on top of orders, approvals, and store activity.",
    },
    {
      icon: IconSparkles,
      title: "Dark mode & polish",
      body: "Theme-aware UI with typography tuned for long browsing sessions.",
    },
  ];
  return (
    <section id="features" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Platform</p>
        <h2 className="font-serif mt-2 text-3xl font-semibold text-zinc-900 sm:text-4xl dark:text-white">
          Everything you expect from a modern marketplace
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Built for shoppers who want choice and for sellers who want reach—without sacrificing clarity or security.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-amber-500/40 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-amber-500/30"
          >
            <f.icon className="h-9 w-9 text-amber-700 transition group-hover:scale-105 dark:text-amber-400" />
            <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeHowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Explore",
      text: "Filter the marketplace by category, vendor, and price to find your next favorite product.",
      image: img.browse,
      alt: "Person paying at a cafe counter with card terminal",
    },
    {
      n: "02",
      title: "Checkout",
      text: "One cart across vendors—payments and confirmations are handled securely.",
      image: img.vendor,
      alt: "Team collaborating over a laptop in a bright office",
    },
    {
      n: "03",
      title: "Track & enjoy",
      text: "Follow sub-orders, message sellers, and leave a review when it arrives.",
      image: img.delivery,
      alt: "Minimal product flatlay with watch and accessories",
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-28 border-y border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/40 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">How it works</p>
            <h2 className="font-serif mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">From discovery to doorstep</h2>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-amber-800 hover:underline dark:text-amber-400">
            Browse all products →
          </Link>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          {steps.map((s) => (
            <article key={s.n} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="relative aspect-[16/10]">
                <Image src={s.image} alt={s.alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <div className="p-6">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{s.n}</span>
                <h3 className="font-serif mt-2 text-xl font-semibold text-zinc-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{s.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeEditorial() {
  const tiles = [
    {
      title: "Fashion & lifestyle",
      sub: "Seasonal edits from independent boutiques",
      href: "/marketplace",
      image: img.lifestyle,
      alt: "Folded sweaters in warm neutral tones",
    },
    {
      title: "Home & craft",
      sub: "Decor and handmade finds",
      href: "/marketplace",
      image: img.craft,
      alt: "Living room interior with sofa and plants",
    },
    {
      title: "Everyday carry",
      sub: "Quality accessories",
      href: "/marketplace",
      image: img.tech,
      alt: "Minimal watch on marble surface",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Collections</p>
          <h2 className="font-serif mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">Shop the look</h2>
          <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
            Editorial-style highlights—tap through to the marketplace to see live inventory from our vendors.
          </p>
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Link
          href={tiles[0].href}
          className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-zinc-200 lg:col-span-2 lg:min-h-[320px] dark:border-zinc-800"
        >
          <Image src={tiles[0].image} alt={tiles[0].alt} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 66vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-0 p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-semibold text-white">{tiles[0].title}</h3>
            <p className="mt-1 text-sm text-zinc-200">{tiles[0].sub}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-amber-300 group-hover:underline">Shop category</span>
          </div>
        </Link>
        <div className="grid gap-4">
          {tiles.slice(1).map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <Image src={t.image} alt={t.alt} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <h3 className="font-serif text-lg font-semibold text-white">{t.title}</h3>
                <p className="text-xs text-zinc-200">{t.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeTestimonials() {
  const quotes = [
    {
      quote: "Finally a marketplace where I can open a store without losing my brand. The vendor dashboard is straightforward.",
      name: "Amelia Chen",
      role: "Boutique owner",
      avatar: img.avatar1,
    },
    {
      quote: "Checkout felt familiar and I liked seeing each vendor’s sub-order status. Messaging saved a sizing question.",
      name: "Marcus Webb",
      role: "Regular shopper",
      avatar: img.avatar2,
    },
    {
      quote: "We use the admin tools for approvals and analytics. Onboarding vendors from the community was painless.",
      name: "Sofia Reyes",
      role: "Marketplace operator",
      avatar: img.avatar3,
    },
  ];
  return (
    <section id="testimonials" className="scroll-mt-28 border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-16 dark:border-zinc-800 dark:from-zinc-900/30 dark:to-zinc-950 sm:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Voices</p>
        <h2 className="font-serif mt-2 text-center text-3xl font-semibold text-zinc-900 dark:text-white">Loved by shoppers & sellers</h2>
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {quotes.map((q) => (
            <blockquote
              key={q.name}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <p className="flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">&ldquo;{q.quote}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-amber-500/30">
                  <Image src={q.avatar} alt={q.name} fill className="object-cover" sizes="48px" />
                </div>
                <div>
                  <cite className="not-italic text-sm font-semibold text-zinc-900 dark:text-white">{q.name}</cite>
                  <p className="text-xs text-zinc-500">{q.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeVendorCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[280px] lg:min-h-[360px]">
            <Image src={img.vendor} alt="Merchant reviewing sales on a tablet" fill className="object-cover opacity-90 lg:rounded-l-3xl" sizes="(max-width: 1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-zinc-950/20 lg:bg-gradient-to-t lg:from-zinc-950/90 lg:to-transparent" />
          </div>
          <div className="flex flex-col justify-center px-8 py-12 lg:px-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">For vendors</p>
            <h2 className="font-serif mt-3 text-3xl font-semibold text-white sm:text-4xl">Grow your audience on Ericah</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              List products with rich images, manage inventory, fulfill sub-orders, and chat with customers from one vendor
              dashboard—plus analytics when you are ready to scale.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="text-amber-400">✓</span> Multi-image product pages
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">✓</span> Coupons & Stripe checkout
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400">✓</span> Admin approval workflow
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?auth=register"
                className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400"
              >
                Create vendor account
              </Link>
              <Link href="/contact" className="rounded-lg border border-zinc-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
                Partner with us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeNewsletter() {
  return (
    <section className="border-t border-zinc-200 bg-white py-14 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-gradient-to-b from-amber-50/60 to-white px-8 py-10 text-center dark:border-zinc-800 dark:from-amber-950/25 dark:to-zinc-900">
          <h2 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">New arrivals & vendor spotlights</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Visit the marketplace for fresh inventory—or open a store and get discovered by shoppers worldwide.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/marketplace"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-900 dark:hover:bg-amber-400"
            >
              Browse new listings
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-800"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const EXPLORE_FALLBACK = [
  { title: "Fashion & apparel", sub: "Layers, footwear, accessories", href: "/marketplace", i: 0 },
  { title: "Home & living", sub: "Furniture, décor, gifts", href: "/marketplace", i: 2 },
  { title: "Active & outdoors", sub: "Training, travel, essentials", href: "/marketplace", i: 5 },
  { title: "Beauty & care", sub: "Skincare, fragrance, tools", href: "/marketplace", i: 4 },
] as const;

/** Shown when the API returns no categories so the home page still has visual entry points. */
export function HomeExploreFallback() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Explore</p>
        <h2 className="font-serif mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">Popular departments</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Connect the API to show your real categories. Until then, here are quick ways to dive into the marketplace.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EXPLORE_FALLBACK.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm transition hover:border-amber-500/50 hover:shadow-md dark:border-zinc-800"
          >
            <Image
              src={HOME_CATEGORY_IMAGES[t.i]}
              alt={t.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/35 to-transparent" />
            <div className="relative flex h-full min-h-[200px] flex-col justify-end p-5">
              <p className="font-serif text-lg font-semibold text-white">{t.title}</p>
              <p className="mt-1 text-sm text-zinc-200/90">{t.sub}</p>
              <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Shop →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
