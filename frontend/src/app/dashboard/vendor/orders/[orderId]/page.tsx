"use client";

import { useAuth } from "@/context/auth-context";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, getPublicOrigin } from "@/lib/api";
import { productImageUnoptimized } from "@/lib/image-url";
import { parseShippingLine2 } from "@/lib/shipping-address";
import { toast } from "sonner";

type SubOrder = {
  vendor: string;
  status: string;
  subtotal: number;
  vendorPayoutTotal: number;
  items: { title: string; quantity: number; lineTotal: number; image?: string }[];
};

type OrderDetail = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user?: { name?: string; email?: string; phone?: string };
  shippingName?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  deliveryNotes?: string;
  subOrders?: SubOrder[];
};

const statusOptions = [
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function VendorOrderDetailPage() {
  const { token, vendor } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [mySub, setMySub] = useState<SubOrder | null>(null);
  const [status, setStatus] = useState("processing");

  const load = useCallback(() => {
    if (!token || !orderId) return;
    apiFetch<OrderDetail>(`/orders/vendor/order/${orderId}`, { token })
      .then((o) => {
        setOrder(o);
        const mine = (o.subOrders || []).find((s) => s.vendor === vendor?._id);
        setMySub(mine || null);
        if (mine && mine.status !== "pending") setStatus(mine.status);
      })
      .catch(() => setOrder(null));
  }, [token, orderId, vendor?._id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveStatus = async () => {
    if (!token || !orderId) return;
    try {
      await apiFetch(`/orders/${orderId}/suborder`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token,
      });
      toast.success("Order status updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!order) {
    return (
      <div>
        <p className="text-sm text-zinc-500">Loading or order not found.</p>
        <Link href="/dashboard/vendor/orders" className="mt-4 inline-block text-amber-700 dark:text-amber-400">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const { apartment: shipApt, notes: notesInLine2 } = parseShippingLine2(order.shippingLine2);
  const notesText = (order.deliveryNotes || notesInLine2 || "").trim();
  const origin = getPublicOrigin();

  return (
    <div>
      <button type="button" onClick={() => router.push("/dashboard/vendor/orders")} className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
        ← Orders
      </button>
      <h1 className="mt-2 font-serif text-2xl font-semibold">Order {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Store order status: <span className="font-medium text-zinc-800 dark:text-zinc-200">{order.status}</span> · Total $
        {order.total.toFixed(2)}
      </p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Customer</h2>
        <p className="mt-2 text-sm">{order.user?.name}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{order.user?.email}</p>
        {order.user?.phone && <p className="text-sm text-zinc-500">{order.user.phone}</p>}
      </section>

      {(order.shippingLine1 || order.shippingCity) && (
        <section className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-amber-100">Ship to (customer delivery form)</h2>
          <div className="mt-3 text-sm text-zinc-800 dark:text-zinc-200">
            {order.shippingName && <p className="font-medium">{order.shippingName}</p>}
            {order.shippingLine1 && <p>{order.shippingLine1}</p>}
            {shipApt && <p className="whitespace-pre-wrap">{shipApt}</p>}
            <p>
              {[order.shippingCity, order.shippingState, order.shippingPostalCode].filter(Boolean).join(", ")}
            </p>
            {order.shippingCountry && <p>{order.shippingCountry}</p>}
            {order.shippingPhone && <p className="mt-2 font-medium">Delivery phone: {order.shippingPhone}</p>}
            {notesText && (
              <div className="mt-3 rounded-lg border border-amber-200/80 bg-white/80 p-3 text-xs dark:border-amber-800 dark:bg-zinc-900/80">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">Delivery notes</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{notesText}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {mySub && (
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold">Your fulfillment</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Your sub-order status: <strong>{mySub.status}</strong> · Your payout share: $
            {mySub.vendorPayoutTotal?.toFixed(2)}
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-zinc-500">Update status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {mySub.status === "pending" && <option value="pending">Pending (start)</option>}
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={saveStatus}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-zinc-900"
            >
              Save status
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Move from pending → processing when you begin packing. Use Shipped / Delivered when complete.
          </p>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Line items (your store)</h2>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {(mySub?.items || []).map((it, i) => {
            const src = it.image
              ? it.image.startsWith("http")
                ? it.image
                : `${origin}${it.image}`
              : "/placeholder-product.svg";
            return (
              <li key={i} className="flex gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized={productImageUnoptimized(src)}
                  />
                </div>
                <div>
                  <p className="font-medium">{it.title}</p>
                  <p className="text-xs text-zinc-500">
                    Qty {it.quantity} · ${it.lineTotal.toFixed(2)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
