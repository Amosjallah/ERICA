/**
 * Hero / empty-state imagery. Most entries use Unsplash (`images.remotePatterns` in `next.config.ts`).
 * About page uses a local SVG so the hero always loads without remote fetch.
 */
export const STOCK_IMAGES = {
  marketplaceEmpty: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
  wishlistEmpty: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80",
  cartEmpty: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=900&q=80",
  ordersEmpty: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
  vendorOrdersEmpty: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
  /** Local asset — avoids remote Unsplash failures (network / optimizer / SSL). */
  aboutMission: "/about-hero.svg",
  contactHero: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  accountWelcome: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
} as const;
