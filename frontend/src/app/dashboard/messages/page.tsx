"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Suspense } from "react";

type Msg = { _id: string; body: string; sender: { name?: string }; createdAt: string };

function MessagesInner() {
  const params = useSearchParams();
  const vendorPref = params.get("vendor");
  const { user, token } = useAuth();
  const [threads, setThreads] = useState<{ conversationId: string; lastMessage: Msg }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [vendorId, setVendorId] = useState(vendorPref || "");

  const loadThreads = () => {
    if (!token) return;
    apiFetch<{ conversationId: string; lastMessage: Msg }[]>("/messages/conversations", { token }).then(
      setThreads
    );
  };

  useEffect(() => {
    loadThreads();
  }, [token]);

  useEffect(() => {
    if (!activeId || !token) return;
    apiFetch<Msg[]>(`/messages/thread/${encodeURIComponent(activeId)}`, { token }).then(setMessages);
  }, [activeId, token]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !body.trim() || !token) return;
    try {
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify(
          user?.role === "vendor"
            ? { vendorId, customerId: params.get("customer"), body: body.trim() }
            : { vendorId, body: body.trim() }
        ),
        token,
      });
      toast.success("Sent");
      setBody("");
      if (activeId) {
        apiFetch<Msg[]>(`/messages/thread/${encodeURIComponent(activeId)}`, { token }).then(setMessages);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (!user) return <p className="px-4 py-12 text-center">Sign in to use messages.</p>;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-64">
        <p className="text-sm font-semibold">Conversations</p>
        <ul className="mt-3 space-y-2 text-sm">
          {threads.map((t) => (
            <li key={t.conversationId}>
              <button
                type="button"
                onClick={() => setActiveId(t.conversationId)}
                className={`w-full rounded-lg px-2 py-2 text-left ${
                  activeId === t.conversationId ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                {t.lastMessage?.body?.slice(0, 40)}…
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex-1">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <label className="text-xs text-zinc-500">Vendor ID (Mongo id)</label>
          <input
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Paste vendor ID from product page network tab or seed output"
          />
          {user.role === "vendor" && (
            <p className="mt-2 text-xs text-zinc-500">
              When replying, add <code>?customer=USER_ID</code> to the URL.
            </p>
          )}
        </div>
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          {messages.map((m) => (
            <div key={m._id} className="text-sm">
              <span className="font-medium">{m.sender?.name}</span>
              <p className="text-zinc-600 dark:text-zinc-300">{m.body}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-zinc-500">Select a thread or start below.</p>}
        </div>
        <form onSubmit={send} className="mt-4 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Type a message…"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <MessagesInner />
    </Suspense>
  );
}
