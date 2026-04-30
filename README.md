# Ericah Marketplace

Full-stack multi-vendor marketplace: **Next.js + Tailwind** frontend, **Express + MongoDB** API, **JWT** auth, **Stripe Checkout** (with **demo checkout** when Stripe keys are absent).

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

## 1. Backend API

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

- Default API: `http://localhost:5000`
- Seed creates **admin**, **vendor**, and **customer** users (see terminal output after seed).
- Uploads are stored under `backend/uploads/` and served at `http://localhost:5000/uploads/...`.

### Environment (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Sign JWT access tokens |
| `CLIENT_URL` | Frontend origin for CORS and Stripe redirects (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | Stripe secret key; leave placeholder for **demo checkout** (orders complete without card) |
| `PLATFORM_COMMISSION_PERCENT` | Platform commission on each line item (default 10) |

## 2. Frontend

```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

- App: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL` should point to the API base including `/api`, e.g. `http://localhost:5000/api`.
- `NEXT_PUBLIC_SITE_ORIGIN` is used for image URLs (same host as API if serving uploads from Express).

## Payments

- **Stripe:** Set `STRIPE_SECRET_KEY` in `backend/.env`. Checkout uses a single line item for the order total; success page calls `/api/checkout/verify-session` to finalize stock and notifications.
- **Demo mode:** If the Stripe key is missing or still the placeholder, checkout completes immediately (no redirect to Stripe) for local testing.
- **Paystack:** Not wired in this repo; you can add a similar “create payment / verify” flow using Paystack’s REST API and the same order model.

## Roles & routes

- **Customer:** browse, cart, checkout, orders, wishlist, reviews, messaging.
- **Vendor:** dashboard, product CRUD (multipart images), order sub-status, analytics summary (pending approval blocks selling).
- **Admin:** analytics, pending vendor approval, users, orders list.

## Project layout

- `backend/src` — Express app, Mongoose models, routes, JWT, uploads, Stripe checkout.
- `frontend/src` — Next.js App Router, shared UI, dashboards, marketplace pages.
