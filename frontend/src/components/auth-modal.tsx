"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { SITE_NAME } from "@/lib/site";
import { SiteLogoFull } from "@/components/site-logo";

export function AuthModalHost() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("auth");
  const { login, register } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [tab, setTab] = useState<"customer" | "vendor">("customer");

  useEffect(() => {
    if (mode === "login" || mode === "register") setOpen(true);
    else setOpen(false);
  }, [mode]);

  const close = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    router.replace(url.pathname + url.search);
    setOpen(false);
  };

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        name,
        email,
        password,
        role: tab === "vendor" ? "vendor" : "customer",
        ...(tab === "vendor" ? { storeName, storeDescription: "" } : {}),
      });
      toast.success("Account created");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex justify-center border-b border-zinc-200 bg-gradient-to-b from-amber-50/40 to-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:from-amber-950/20 dark:to-zinc-950/80">
          <SiteLogoFull />
        </div>
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {isLogin ? "Sign in" : "Create account"}
          </h2>
          <button type="button" onClick={close} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
            ✕
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-3 p-5">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
            >
              Continue
            </button>
            <p className="text-center text-xs text-zinc-500">
              New here?{" "}
              <button
                type="button"
                className="font-medium text-amber-600"
                onClick={() => router.replace("/?auth=register")}
              >
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 p-5">
            <p className="-mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Join {SITE_NAME} — browse campus shops or register as a vendor to sell here.
            </p>
            <div className="flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setTab("customer")}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                  tab === "customer"
                    ? "bg-white shadow dark:bg-zinc-900"
                    : "text-zinc-500"
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setTab("vendor")}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
                  tab === "vendor" ? "bg-white shadow dark:bg-zinc-900" : "text-zinc-500"
                }`}
              >
                Vendor
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
            {tab === "vendor" && (
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Store name</label>
                <input
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Password (min 6)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-amber-100 dark:bg-amber-600 dark:text-zinc-900"
            >
              Register
            </button>
            <p className="text-center text-xs text-zinc-500">
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-amber-600"
                onClick={() => router.replace("/?auth=login")}
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
