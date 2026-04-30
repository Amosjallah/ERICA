import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Ericah Marketplace</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A premium multi-vendor destination for curated products.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Shop</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/marketplace" className="hover:text-amber-600">
                All products
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
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Sell</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/?auth=register" className="hover:text-amber-600">
                Become a vendor
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Account</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <Link href="/dashboard" className="hover:text-amber-600">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        © {new Date().getFullYear()} Ericah Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
