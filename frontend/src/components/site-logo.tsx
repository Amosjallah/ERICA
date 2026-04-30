"use client";

import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

type SiteLogoFullProps = {
  className?: string;
};

/** Theme-aware wordmark. Swap the SVG body for an `<Image />` if you export a PNG/SVG from your design chat into `public/`. */
export function SiteLogoFull({ className }: SiteLogoFullProps) {
  return (
    <Link href="/" className={`inline-flex items-center ${className ?? ""}`} aria-label={`${SITE_NAME} home`}>
      <svg
        viewBox="0 0 286 48"
        className="h-9 w-auto max-w-[min(100%,220px)] text-zinc-900 sm:h-10 sm:max-w-[260px] dark:text-zinc-50"
        role="img"
        aria-hidden
      >
        <title>{SITE_NAME}</title>
        <rect x="0" y="4" width="46" height="40" rx="12" className="fill-amber-500/20" />
        <rect x="4" y="8" width="38" height="32" rx="10" className="fill-zinc-900 dark:fill-zinc-200" />
        <path className="fill-amber-500 dark:fill-amber-400" d="M16 16h3v14h-3V16zm6 0h3l5 7-5 7h-3l4.2-7L22 16z" />
        <path className="fill-amber-500 dark:fill-amber-400" d="M13 30h22v2H13v-2z" />
        <text x="54" y="33" fill="currentColor" fontSize="23" fontFamily="Georgia, serif" fontWeight="600">
          KTU
        </text>
        <text
          x="112"
          y="33"
          className="fill-amber-600 dark:fill-amber-400"
          fontSize="18"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          letterSpacing="0.12em"
        >
          E-MARKET
        </text>
        <text
          x="54"
          y="44"
          className="fill-zinc-500 dark:fill-zinc-400"
          fontSize="6.5"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.22em"
        >
          CAMPUS MARKETPLACE
        </text>
      </svg>
    </Link>
  );
}

type SiteLogoMarkProps = {
  className?: string;
  size?: number;
};

export function SiteLogoMark({ className, size = 36 }: SiteLogoMarkProps) {
  return (
    <Link href="/" className={className} aria-label={`${SITE_NAME} home`}>
      <svg width={size} height={size} viewBox="0 0 32 32" className="rounded-lg" role="img" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-zinc-900 dark:fill-zinc-100" />
        <path className="fill-amber-500 dark:fill-amber-400" d="M10 10h2.5v12H10V10zm5 0h2.5l4 5.2-4 5.2H15l3.4-5.2L15 10z" />
        <path className="fill-amber-500 dark:fill-amber-400" d="M8 22h16v1.8H8V22z" />
      </svg>
    </Link>
  );
}
