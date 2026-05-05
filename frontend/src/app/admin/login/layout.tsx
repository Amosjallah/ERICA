import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin sign-in",
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
