"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { SiteLogoFull } from "@/components/site-logo";
import { SITE_NAME_SHORT } from "@/lib/site";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading, adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") {
      router.replace("/dashboard/admin");
    }
  }, [loading, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminLogin(email, password);
      toast.success("Signed in");
      router.replace("/dashboard/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user?.role === "admin") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-zinc-500">
        {loading ? "Loading…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex justify-center">
        <SiteLogoFull compact />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="font-serif text-xl font-semibold text-zinc-900 dark:text-white">Platform admin</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to manage {SITE_NAME_SHORT}. Use an account with the admin role only.
        </p>
        {user && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            You are signed in as {user.role}.{" "}
            <Link href="/" className="font-medium underline">
              Home
            </Link>{" "}
            or sign out from the header, then sign in with an admin account.
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-amber-100 disabled:opacity-60 dark:bg-amber-600 dark:text-neutral-950"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-xs text-zinc-500">
        <Link href="/" className="text-amber-700 hover:underline dark:text-amber-400">
          ← Back to site
        </Link>
      </p>
    </div>
  );
}
