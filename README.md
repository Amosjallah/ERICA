# KTU E-MARKET

Full-stack multi-vendor marketplace: **Next.js + Tailwind** frontend, **Express + PostgreSQL (Supabase)** API via **Prisma**, **JWT** auth, **Stripe Checkout** (with **demo checkout** when Stripe keys are absent).

## Prerequisites

- Node.js 18+
- A **PostgreSQL** database — recommended: **[Supabase](https://supabase.com)** (hosted Postgres + dashboard)

## 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → Database** and copy the **URI** connection string (use **Transaction** pooler or **Direct**; append `?sslmode=require` if your client requires it).
3. Put it in `backend/.env` as `DATABASE_URL` (see `.env.example`).

Push the schema and seed:

```bash
cd backend
copy .env.example .env
# Edit .env: set DATABASE_URL to your Supabase Postgres URI

npm install
npx prisma db push
npm run seed
npm run dev
```

- Default API: `http://localhost:5000`
- Seed creates **admin**, **vendor**, and **customer** users at `@ktu-emarket.local` (passwords printed in the terminal).
- Uploads live under `backend/uploads/` and are served at `http://localhost:5000/uploads/...`.

### Environment (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase URI) |
| `JWT_SECRET` | Sign JWT access tokens |
| `CLIENT_URL` | Frontend origin for CORS and Stripe redirects (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key; leave placeholder for **demo checkout** |
| `PLATFORM_COMMISSION_PERCENT` | Platform commission on each line item (default 10) |

## 2. Frontend

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

- `backend/prisma` — Prisma schema (`schema.prisma`).
- `backend/src` — Express app, routes, JWT, uploads, Stripe checkout.
- `frontend/src` — Next.js App Router, UI, dashboards, marketplace pages.
