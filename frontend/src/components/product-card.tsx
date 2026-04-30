"use client";

import Image from "next/image";
import Link from "next/link";
import { getPublicOrigin } from "@/lib/api";

export type ProductCardProps = {
  product: {
    _id: string;
    title: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    averageRating?: number;
    reviewCount?: number;
    vendor?: { slug?: string; storeName?: string };
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const vSlug = product.vendor?.slug;
  const href = vSlug ? `/product/${vSlug}/${product.slug}` : "#";
  const img = product.images?.[0];
  const src = img ? `${getPublicOrigin()}${img}` : "/placeholder-product.svg";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 25vw"
          unoptimized={src.startsWith("http://localhost") || src.endsWith(".svg")}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.title}</p>
        {product.vendor?.storeName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{product.vendor.storeName}</p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-semibold text-zinc-900 dark:text-white">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-zinc-400 line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
        {(product.reviewCount ?? 0) > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ★ {product.averageRating?.toFixed(1)} ({product.reviewCount} reviews)
          </p>
        )}
      </div>
    </Link>
  );
}
