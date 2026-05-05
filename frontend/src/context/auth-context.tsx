"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type UserRole = "customer" | "vendor" | "admin";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
};

export type VendorProfile = {
  _id: string;
  storeName: string;
  slug: string;
  approvalStatus: string;
  description?: string;
  logo?: string;
};

type AuthState = {
  user: User | null;
  vendor: VendorProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Platform admin only — same as login but rejects non-admin accounts. */
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!t) {
      setUser(null);
      setVendor(null);
      setToken(null);
      return;
    }
    setToken(t);
    try {
      const data = await apiFetch<{ user: User; vendor?: VendorProfile | null }>("/auth/me", {
        token: t,
      });
      setUser(data.user);
      setVendor(data.vendor ?? null);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      setVendor(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const em = email.trim();
    const data = await apiFetch<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: em, password }),
      token: null,
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const adminLogin = async (email: string, password: string) => {
    const em = email.trim();
    const data = await apiFetch<{ token: string; user: User }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email: em, password }),
      token: null,
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const register = async (payload: Record<string, unknown>) => {
    const body =
      typeof payload.email === "string" ? { ...payload, email: payload.email.trim() } : payload;
    const data = await apiFetch<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      token: null,
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setVendor(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, vendor, token, loading, login, adminLogin, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
