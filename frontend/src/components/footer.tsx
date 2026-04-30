import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{SITE_NAME}</p>
          <p className="mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            Campus-led multi-vendor marketplace: curated shops, secure checkout, wishlists, messaging, and vendor tools.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Shop</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/shops" className="hover:text-amber-600">
                All shops
              </Link>
            </li>
            <li>
              <Link href="/marketplace" className="hover:text-amber-600">
                All products
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-amber-600">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-amber-600">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-amber-600">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Features</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/#features" className="hover:text-amber-600">
                Platform overview
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-amber-600">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/#testimonials" className="hover:text-amber-600">
                Testimonials
              </Link>
            </li>
            <li>
              <Link href="/shops" className="hover:text-amber-600">
                All shops
              </Link>
            </li>
            <li>
              <Link href="/marketplace" className="hover:text-amber-600">
                Browse products
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Sell & account</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/?auth=register" className="hover:text-amber-600">
                Become a vendor
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-amber-600">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/vendor" className="hover:text-amber-600">
                Vendor portal
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
