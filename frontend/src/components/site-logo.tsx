"use client";

import Image from "next/image";
import Link from "next/link";
import { LOGO_BRAND_HEIGHT, LOGO_BRAND_SRC, LOGO_BRAND_WIDTH, SITE_NAME } from "@/lib/site";

type SiteLogoFullProps = {
  className?: string;
};

/** Official brand mark — image from `public/ktu-e-market-brand.png` */
export function SiteLogoFull({ className }: SiteLogoFullProps) {
  return (
    <Link href="/" className={`inline-flex items-center ${className ?? ""}`} aria-label={`${SITE_NAME} home`}>
      <span className="rounded-lg bg-black px-2 py-1 shadow-sm ring-1 ring-zinc-800/90 dark:ring-amber-900/40">
        <Image
          src={LOGO_BRAND_SRC}
          alt={SITE_NAME}
          width={LOGO_BRAND_WIDTH}
          height={LOGO_BRAND_HEIGHT}
          className="h-9 w-auto max-w-[min(100%,280px)] sm:h-10"
          priority
        />
      </span>
    </Link>
  );
}

type SiteLogoMarkProps = {
  className?: string;
  size?: number;
};

export function SiteLogoMark({ className, size = 40 }: SiteLogoMarkProps) {
  return (
    <Link href="/" className={className} aria-label={`${SITE_NAME} home`}>
      <span
        className="inline-flex overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-zinc-700 dark:ring-amber-900/50"
        style={{ width: size, height: size }}
      >
        <Image
          src={LOGO_BRAND_SRC}
          alt=""
          width={LOGO_BRAND_WIDTH}
          height={LOGO_BRAND_HEIGHT}
          className="h-full w-full object-contain object-center p-0.5"
          sizes={`${size}px`}
        />
      </span>
    </Link>
  );
}
