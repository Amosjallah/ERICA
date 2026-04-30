export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
}

export function getPublicOrigin() {
  const api = getApiBase().replace(/\/api\/?$/, "");
  return process.env.NEXT_PUBLIC_SITE_ORIGIN || api || "http://localhost:5000";
}

export async function apiFetch<T>(
  path: string,
  options?: (RequestInit & { token?: string | null }) | undefined
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && options?.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  let authToken: string | null | undefined = options?.token as string | null | undefined;
  if (authToken === undefined && typeof window !== "undefined") {
    authToken = localStorage.getItem("token");
  }
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string })?.message || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export async function apiForm<T>(path: string, form: FormData, token?: string | null) {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const headers = new Headers();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(`${getApiBase()}${path}`, { method: "POST", body: form, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string })?.message || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}
