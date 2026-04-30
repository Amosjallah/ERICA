import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/shops", "Shops"],
  ["/marketplace", "Marketplace"],
  ["/wishlist", "Wishlist"],
  ["/cart", "Cart"],
  ["/dashboard", "Dashboard"],
  ["/checkout", "Checkout"],
  ["/contact", "Contact"],
] as const;

/** Compact cross-links shown on inner pages (not the marketing home). */
export function PageQuickNav() {
  return (
    <nav
      aria-label="Quick links"
      className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-zinc-200 pb-3 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
    >
      {links.map(([href, label], i) => (
        <span key={href} className="inline-flex items-center gap-x-1">
          {i > 0 && <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>/</span>}
          <Link href={href} className="rounded px-1 py-0.5 hover:bg-zinc-100 hover:text-amber-700 dark:hover:bg-zinc-800 dark:hover:text-amber-400">
            {label}
          </Link>
        </span>
      ))}
      <span className="ml-auto hidden text-zinc-400 sm:inline">KTU E-MARKET</span>
    </nav>
  );
}
