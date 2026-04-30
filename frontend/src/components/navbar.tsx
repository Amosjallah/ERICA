"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import clsx from "clsx";
import { SITE_NAME } from "@/lib/site";

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  const goSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/marketplace?q=${encodeURIComponent(q.trim())}`);
  };

  useEffect(() => {
    if (!user) return;
    const t = localStorage.getItem("token");
    if (!t) return;
    apiFetch<{ items: { product?: unknown }[] }>("/cart", { token: t })
      .then((c) => setCartCount(c.items?.length ?? 0))
      .catch(() => {});
    apiFetch<{ read: boolean }[]>("/notifications", { token: t })
      .then((n) => setNotifCount(n.filter((x) => !x.read).length))
      .catch(() => {});
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            {SITE_NAME.split(" ")[0]}{" "}
            <span className="text-amber-600">{SITE_NAME.split(" ").slice(1).join(" ")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:hidden"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>

        <form onSubmit={goSearch} className="order-3 flex-1 sm:order-none sm:max-w-xl">
          <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 focus-within:ring-2 focus-within:ring-amber-500/30 dark:border-zinc-800 dark:bg-zinc-900">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, and more"
              className="w-full min-w-0 border-0 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
            />
            <button
              type="submit"
              className="shrink-0 bg-zinc-900 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-zinc-800 dark:bg-amber-600 dark:text-zinc-900 dark:hover:bg-amber-500"
            >
              Search
            </button>
          </div>
        </form>

        <nav className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 sm:inline-block"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <Link
            href="/shops"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            Shops
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            Shop
          </Link>
          {user && (
            <Link
              href="/wishlist"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Wishlist
            </Link>
          )}
          <Link
            href="/cart"
            className={clsx(
              "relative rounded-lg px-2 py-1.5 text-sm font-medium",
              "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            )}
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-0.5 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {user && notifCount > 0 && (
            <span className="text-xs text-amber-600" title="Unread notifications">
              {notifCount} new
            </span>
          )}

          {!loading && !user && (
            <div className="flex items-center gap-1">
              <Link
                href="/?auth=login"
                className="rounded-lg px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Sign in
              </Link>
              <Link
                href="/?auth=register"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
              >
                Join
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 pl-1">
              <Link
                href="/dashboard"
                className="max-w-[8rem] truncate text-sm font-medium text-zinc-800 dark:text-zinc-100"
              >
                {user.name}
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  toast.success("Signed out");
                  router.push("/");
                }}
                className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
