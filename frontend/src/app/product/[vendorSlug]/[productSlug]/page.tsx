import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "./product-actions";
import { ReviewSection } from "./review-section";
import { getPublicOrigin } from "@/lib/api";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ vendorSlug: string; productSlug: string }>;
}) {
  const { vendorSlug, productSlug } = await params;
  const res = await fetch(`${api}/products/${vendorSlug}/${productSlug}`, { next: { revalidate: 30 } });
  if (!res.ok) notFound();
  const product = await res.json();
  const img = product.images?.[0];
  const src = img ? `${getPublicOrigin()}${img}` : "/placeholder-product.svg";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800">
          <Image
            src={src}
            alt={product.title}
            fill
            className="object-contain p-4"
            unoptimized={src.includes("localhost") || src.endsWith(".svg")}
            priority
          />
        </div>
        <div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <Link href={`/vendor/${product.vendor?.slug}`} className="hover:underline">
              {product.vendor?.storeName}
            </Link>
          </p>
          <h1 className="font-serif mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">
            {product.title}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">${Number(product.price).toFixed(2)}</span>
            {product.compareAtPrice > product.price && (
              <span className="text-lg text-zinc-400 line-through">
                ${Number(product.compareAtPrice).toFixed(2)}
              </span>
            )}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {product.description}
          </p>
          <p className="mt-4 text-sm text-zinc-500">Stock: {product.stock} available</p>
          <div className="mt-8">
            <ProductActions
              productId={product._id}
              vendorId={product.vendor?._id}
              stock={product.stock}
            />
          </div>
        </div>
      </div>
      <ReviewSection productId={product._id} />
    </div>
  );
}
