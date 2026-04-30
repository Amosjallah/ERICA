"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";

export default function CheckoutSuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderNum = params.get("order");
  const demo = params.get("demo");
  const { user, token } = useAuth();
  const [message, setMessage] = useState("Confirming your order…");

  useEffect(() => {
    if (!sessionId || !user || !token) {
      if (demo || orderNum) setMessage("Thank you! Your demo order was placed.");
      else setMessage("Thank you for shopping with Ericah Marketplace.");
      return;
    }
    apiFetch("/checkout/verify-session", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
      token,
    })
      .then(() => setMessage("Payment confirmed. Thank you!"))
      .catch(() => setMessage("Order received. Check your email for confirmation."));
  }, [sessionId, user, token, demo, orderNum]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-3xl font-semibold text-zinc-900 dark:text-white">Thank you</h1>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      {orderNum && (
        <p className="mt-2 text-sm text-zinc-500">
          Order reference: <strong>{orderNum}</strong>
        </p>
      )}
      <Link
        href="/dashboard"
        className="mt-8 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
      >
        View orders
      </Link>
    </div>
  );
}
