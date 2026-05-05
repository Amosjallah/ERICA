"use client";

import Image from "next/image";
import Link from "next/link";
import { LOGO_BRAND_HEIGHT, LOGO_BRAND_SRC, LOGO_BRAND_WIDTH, SITE_NAME } from "@/lib/site";

type SiteLogoFullProps = {
  className?: string;
  /** Smaller wordmark for tight layouts (e.g. auth modal). */
  compact?: boolean;
};

/** Official brand mark — image from `public/ktu-e-market-brand.svg` */
export function SiteLogoFull({ className, compact }: SiteLogoFullProps) {
  const imgClass = compact
    ? "h-9 w-auto max-w-[min(100%,260px)] sm:h-10"
    : "h-11 w-auto max-w-[min(100%,320px)] sm:h-12 sm:max-w-[min(100%,400px)] md:h-14 md:max-w-[min(100%,460px)] lg:h-16 lg:max-w-[min(100%,520px)]";

  return (
    <Link href="/" className={`inline-flex items-center ${className ?? ""}`} aria-label={`${SITE_NAME} home`}>
      <span className="rounded-lg bg-black px-2.5 py-1.5 shadow-sm ring-1 ring-zinc-800/90 dark:ring-amber-900/40">
        <Image
          src={LOGO_BRAND_SRC}
          alt={SITE_NAME}
          width={LOGO_BRAND_WIDTH}
          height={LOGO_BRAND_HEIGHT}
          className={imgClass}
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

export function SiteLogoMark({ className, size = 52 }: SiteLogoMarkProps) {
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
