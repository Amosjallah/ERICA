"use client";

import { usePathname } from "next/navigation";
import { PageQuickNav } from "@/components/page-quick-nav";

export function MainChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isHome = pathname === "/";

  return (
    <>
      {!isHome && (
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <PageQuickNav />
        </div>
      )}
      {children}
    </>
  );
}
