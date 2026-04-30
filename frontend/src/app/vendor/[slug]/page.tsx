import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default async function VendorStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${api}/vendors/store/${slug}`, { next: { revalidate: 30 } });
  if (!res.ok) notFound();
  const data = await res.json();
  const { vendor, products } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">
          {vendor.storeName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{vendor.description}</p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(products || []).map((p: never) => (
          <ProductCard key={(p as { _id: string })._id} product={p as never} />
        ))}
      </div>
      {(products || []).length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">This store has no products yet.</p>
      )}
      <p className="mt-8 text-sm">
        <Link href="/marketplace" className="text-amber-700 hover:underline dark:text-amber-400">
          ← Back to marketplace
        </Link>
      </p>
    </div>
  );
}
