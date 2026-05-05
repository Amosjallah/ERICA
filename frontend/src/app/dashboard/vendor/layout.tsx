"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { VendorSidebar } from "@/components/vendor-sidebar";

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/");
    else if (user.role !== "vendor") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "vendor") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-500">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-[1400px] mx-auto">
      <VendorSidebar />
      <div className="min-w-0 flex-1 overflow-auto bg-zinc-50/80 px-4 py-8 dark:bg-zinc-950/50 md:px-8">{children}</div>
    </div>
  );
}
