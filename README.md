# KTU E-MARKET

Full-stack multi-vendor marketplace: **Next.js + Tailwind** frontend, **Express** API using the **Supabase JavaScript client** (service role) against **Postgres on Supabase**, **JWT** auth, **Stripe Checkout** (with **demo checkout** when Stripe keys are absent).

## Prerequisites

- Node.js 18+
- A **[Supabase](https://supabase.com)** project (Postgres + API URL + service role key)

## 1. Database schema (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → **New query**, paste the contents of **`supabase/migrations/20250430190000_initial_schema.sql`**, and run it. This creates tables, enums, indexes, foreign keys, and the **`finalize_order_payment`** RPC used at checkout.

## 2. Backend

From the **repository root** you can start **frontend + API together**:

```bash
npm install
npm run dev
```

This runs Next.js and the Express API in one terminal. To run them separately: `npm run dev:frontend` and `npm run dev:backend`.

Or from **`backend/`** only:

```bash
cd backend
copy .env.example .env
# Edit .env: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Project Settings → API

npm install
npm run seed
npm run dev
```

- Default API: `http://localhost:5000`
- Seed creates **admin**, **vendor**, and **customer** users at `@ktu-emarket.local` (passwords printed in the terminal).
- Uploads live under `backend/uploads/` and are served at `http://localhost:5000/uploads/...`.

### Environment (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — full access; never expose to the browser |
| `JWT_SECRET` | Sign JWT access tokens |
| `CLIENT_URL` | Frontend origin for CORS and Stripe redirects (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key; leave placeholder for **demo checkout** |
| `PLATFORM_COMMISSION_PERCENT` | Platform commission on each line item (default 10) |

## 3. Frontend

Create **`frontend/.env.local`** (see `frontend/.env.local.example`) with at least `NEXT_PUBLIC_API_URL` pointing at your API.

If you did **not** use root `npm run dev`, install and start from **`frontend/`**:

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

- App: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` — API base including `/api`, e.g. `http://localhost:5000/api`.
- `NEXT_PUBLIC_SITE_ORIGIN` — origin used for product image URLs (usually your API host).

## Deploying the frontend (Vercel)

This repo is a **monorepo** (`backend/` + `frontend/`). On Vercel you **must** set **Root Directory** to **`frontend`**. If the root stays at the repository root, there is no Next.js app there, so Vercel serves nothing useful and you see **`404: NOT_FOUND`** everywhere.

**Steps**

1. Open the project on [Vercel](https://vercel.com/dashboard) → **Settings** → **General**.
2. **Root Directory** → **Edit** → select **`frontend`** (the folder that contains `next.config.ts` and `package.json` for the Next.js app). Leaving this at **`.`** (repo root) produces **`404: NOT_FOUND`** because there is no Next.js build at the repository root.
3. Click **Save**.
4. **Deployments** → **⋯** on the latest deployment → **Redeploy** — turn **Use existing Build Cache** **off** once so the new root directory is picked up cleanly.

A root `package.json` / `vercel.json` only helps local or custom CI builds; **Git deploys on Vercel still need Root Directory = `frontend`** so the platform runs `next build` in the right folder and publishes `frontend/.next`.

**Environment variables** (Vercel → **Settings** → **Environment Variables**), for Production:

- **`NEXT_PUBLIC_API_URL`** — your **deployed** API base including `/api`, e.g. `https://your-api.onrender.com/api` (not localhost).
- **`NEXT_PUBLIC_SITE_ORIGIN`** — usually the API origin without `/api`, for image URLs like `/uploads/...`.

The Express API in **`backend/`** must run on another host (Railway, Render, Fly.io, etc.). Set **`CLIENT_URL`** on the API to your Vercel site URL (for example your production frontend URL) for CORS and Stripe redirects.

## Payments

- **Stripe:** Set `STRIPE_SECRET_KEY` in `backend/.env`. Success page calls `/api/checkout/verify-session` to finalize stock and notifications.
- **Demo mode:** If the Stripe key is missing or still the placeholder, checkout completes without redirecting to Stripe.
- **Paystack:** Not implemented here; you can mirror the Stripe verify/finalize pattern.

## Roles & routes

- **Customer:** browse, cart, checkout, orders, wishlist, reviews, messaging, **`/shops`** (vendor directory + external marketplace links).
- **Vendor:** dashboard, product CRUD (multipart images), order sub-status, analytics (pending approval blocks selling).
- **Admin:** analytics, pending vendor approval, users, orders list.

## Project layout

- `supabase/migrations` — Postgres DDL + `finalize_order_payment` RPC (run in Supabase SQL editor).
- `backend/src` — Express app, routes, JWT, uploads, Stripe checkout, Supabase client.
- `frontend/src` — Next.js App Router, UI, dashboards, marketplace pages.
