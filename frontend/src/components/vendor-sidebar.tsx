"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const items: { href: string; label: string }[] = [
  { href: "/dashboard/vendor", label: "Dashboard Overview" },
  { href: "/dashboard/vendor/products", label: "Products" },
  { href: "/dashboard/vendor/orders", label: "Orders" },
  { href: "/dashboard/vendor/earnings", label: "Earnings" },
  { href: "/dashboard/vendor/customers", label: "Customers" },
  { href: "/dashboard/vendor/settings", label: "Store Settings" },
  { href: "/dashboard/vendor/discounts", label: "Discounts" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/vendor/notifications", label: "Notifications" },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, vendor } = useAuth();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-3 py-4 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Vendor</p>
        <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{vendor?.storeName}</p>
        <p className="truncate text-xs text-zinc-500">{vendor?.approvalStatus}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map(({ href, label }) => {
          const active =
            href === "/dashboard/vendor"
              ? pathname === "/dashboard/vendor"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-amber-100 font-medium text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
            router.refresh();
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Logout
        </button>
        <Link
          href="/dashboard"
          className="mt-1 block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ← Account home
        </Link>
      </div>
    </aside>
  );
}
