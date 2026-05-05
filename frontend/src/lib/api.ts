/** Base URL for JSON API (must end with `/api`). Missing suffix is fixed so requests are not sent to `/auth/...` on the origin root (404). */
export function getApiBase() {
  let base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").trim();
  base = base.replace(/\/+$/, "");
  if (!/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return base;
}

export function getPublicOrigin() {
  const api = getApiBase().replace(/\/api\/?$/, "");
  return process.env.NEXT_PUBLIC_SITE_ORIGIN || api || "http://localhost:5000";
}

function networkHelpMessage() {
  const base = getApiBase();
  return `Cannot reach the API at ${base}. From backend: npm run dev. If the process exits right away, check backend/.env for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and run the SQL in supabase/migrations/ in your Supabase project. If the backend log says the port is already in use, stop the other process or set PORT in backend/.env and the same port in frontend/.env.local as NEXT_PUBLIC_API_URL (e.g. http://localhost:5001/api). Set NEXT_PUBLIC_API_URL in frontend/.env.local if the API is not on localhost:5000. Set backend CLIENT_URL to your frontend origin (e.g. http://localhost:3000) for CORS.`;
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

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Failed to fetch" || e instanceof TypeError) {
      throw new Error(networkHelpMessage());
    }
    throw e;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { message?: string; errors?: { msg?: string }[] };
    const firstVal = Array.isArray(d.errors) && d.errors[0]?.msg ? d.errors[0].msg : null;
    const msg = d.message || firstVal || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export async function apiForm<T>(
  path: string,
  form: FormData,
  token?: string | null,
  init?: { method?: string }
) {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const headers = new Headers();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, { method: init?.method || "POST", body: form, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Failed to fetch" || e instanceof TypeError) {
      throw new Error(networkHelpMessage());
    }
    throw e;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { message?: string; errors?: { msg?: string }[] };
    const firstVal = Array.isArray(d.errors) && d.errors[0]?.msg ? d.errors[0].msg : null;
    const msg = d.message || firstVal || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}
