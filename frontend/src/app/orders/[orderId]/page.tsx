"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { apiFetch, getPublicOrigin } from "@/lib/api";
import { parseShippingLine2 } from "@/lib/shipping-address";
import { productImageUnoptimized } from "@/lib/image-url";

type Line = {
  title: string;
  quantity: number;
  lineTotal: number;
  image?: string;
  product?: string;
  vendor?: string;
};

type SubOrder = {
  vendor: string;
  status: string;
  subtotal: number;
  items: Line[];
};

type OrderDetail = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
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

export default function CustomerOrderDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const orderId = String(params.orderId || "");
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const load = useCallback(() => {
    if (!token || !orderId) return;
    apiFetch<OrderDetail>(`/orders/my/${orderId}`, { token }).then(setOrder).catch(() => setOrder(null));
  }, [token, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-zinc-500">Loading or order not found.</p>
        <Link href="/orders" className="mt-4 inline-block text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
          ← All orders
        </Link>
      </div>
    );
  }

  const origin = getPublicOrigin();
  const { apartment: shipApt, notes: notesInLine2 } = parseShippingLine2(order.shippingLine2);
  const notesText = (order.deliveryNotes || notesInLine2 || "").trim();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/orders" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
        ← Orders
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-zinc-900 dark:text-white">Order {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Status: <span className="font-medium text-zinc-800 dark:text-zinc-200">{order.status.replace(/_/g, " ")}</span> · Total $
        {Number(order.total).toFixed(2)}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{new Date(order.createdAt).toLocaleString()}</p>

      {(order.shippingLine1 || order.shippingCity) && (
        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Delivery address</h2>
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {order.shippingName && <p className="font-medium">{order.shippingName}</p>}
            {order.shippingLine1 && <p>{order.shippingLine1}</p>}
            {shipApt && <p className="whitespace-pre-wrap">{shipApt}</p>}
            <p>
              {[order.shippingCity, order.shippingState, order.shippingPostalCode].filter(Boolean).join(", ")}
            </p>
            {order.shippingCountry && <p>{order.shippingCountry}</p>}
            {order.shippingPhone && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">Phone: {order.shippingPhone}</p>
            )}
            {notesText && (
              <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">Delivery notes</p>
                <p className="mt-1 whitespace-pre-wrap">{notesText}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-8 space-y-6">
        {(order.subOrders || []).map((sub, i) => (
          <section key={i} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Vendor shipment</h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium capitalize text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                {sub.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Subtotal ${Number(sub.subtotal).toFixed(2)}</p>
            <ul className="mt-4 space-y-3">
              {(sub.items || []).map((line, j) => {
                const src = line.image ? (line.image.startsWith("http") ? line.image : `${origin}${line.image}`) : "/placeholder-product.svg";
                return (
                  <li key={j} className="flex gap-3 border-t border-zinc-100 pt-3 first:border-t-0 first:pt-0 dark:border-zinc-800">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized={productImageUnoptimized(src)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{line.title}</p>
                      <p className="text-xs text-zinc-500">
                        Qty {line.quantity} · ${Number(line.lineTotal).toFixed(2)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/marketplace" className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
          Continue shopping
        </Link>
        <Link href="/dashboard/messages" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          Messages
        </Link>
      </div>
    </div>
  );
}
