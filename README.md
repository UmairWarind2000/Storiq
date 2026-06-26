# Storiq — AI-Powered E-commerce Analytics & Autopilot SaaS

**Live demo:** https://storiq-web.vercel.app
**Backend API:** https://storiq-production.up.railway.app
**Repository:** https://github.com/UmairWarind2000/Storiq

> Click **"View live demo — no signup needed"** on the login page to explore the full product instantly with 30 days of realistic sample data — no Shopify store or signup required.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [What Storiq Does](#what-storiq-does)
3. [Core Features](#core-features)
4. [How It Works — User Journey](#how-it-works--user-journey)
5. [Tech Stack](#tech-stack)
6. [System Architecture](#system-architecture)
7. [Project / Folder Structure](#project--folder-structure)
8. [Data Models](#data-models)
9. [API Reference](#api-reference)
10. [Background Jobs](#background-jobs)
11. [Key Architecture Decisions](#key-architecture-decisions)
12. [User Guide](#user-guide)
13. [Local Development Setup](#local-development-setup)
14. [Environment Variables](#environment-variables)
15. [Deployment](#deployment)
16. [Pricing Model](#pricing-model)
17. [Contact](#contact)

---

## Problem Statement

Small and mid-sized Shopify merchants face three recurring operational problems:

1. **They don't have time to analyze their own sales data.** Raw order and inventory numbers sit in the Shopify admin panel, but turning them into a decision ("which product should I discount this week?") requires manual spreadsheet work most merchants never do.
2. **They lose revenue to abandoned carts and stockouts silently.** A customer abandons a cart and is never followed up with. A bestseller runs out of stock and the merchant finds out only after sales stop.
3. **Existing tools require manual setup for every campaign.** Running a discount, writing a recovery email, or setting a reorder reminder all require the merchant to notice the problem first and then act on it manually.

**Storiq removes the "notice and act" step entirely.** It connects to a Shopify store once, then runs continuously in the background — detecting problems and either fixing them automatically (Pro plan) or surfacing a ready-to-approve fix (one click).

---

## What Storiq Does

Storiq is a **multi-tenant SaaS** that:

- Connects to any Shopify store via OAuth in two clicks
- Analyzes 30 days of sales data every night using Google Gemini
- Writes a plain-English summary of how the store is performing
- Detects slow-moving products and proposes AI-generated discount campaigns
- Automatically creates Shopify discount codes once a campaign is approved
- Tracks inventory velocity and warns before a bestseller runs out of stock
- Detects abandoned shopping carts and sends a personalized AI-written recovery email exactly one hour after abandonment
- Gates advanced automation behind a $29/month Pro subscription billed through Stripe

Every store's data is fully isolated from every other store using tenant-scoped database queries enforced at the middleware level — this is a genuine multi-tenant SaaS, not a single-store tool.

---

## Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Shopify OAuth connect** | Merchant enters their store URL, approves permissions on Shopify's own consent screen, and is redirected back fully authenticated — no manual API key copying. |
| 2 | **AI sales dashboard** | 30-day revenue chart, 7-day vs 30-day comparison, average order value, and a daily AI-generated plain-English performance summary with a top insight and any alerts. |
| 3 | **Autopilot campaign engine** | Every night, AI scans for products selling less than 1 unit/day with healthy stock, recommends a discount % + duration + confidence score, and creates a pending campaign. Pro users approve with one click; high-confidence campaigns can auto-approve. |
| 4 | **Shopify campaign sync** | Once approved, a background job creates a real Shopify price rule and discount code via the Shopify REST API — no manual discount setup in the Shopify admin. |
| 5 | **Smart restock alerts** | Nightly job calculates each product's sales velocity and divides remaining inventory by that velocity to estimate days until stockout. Products under 14 days trigger a categorized alert (critical / warning / watch) and an email. |
| 6 | **Abandoned cart recovery** | A Shopify `carts/create` webhook schedules a delayed job exactly 1 hour later. If the cart hasn't converted to an order by then, Gemini writes a personalized recovery email mentioning the actual product, and it's sent via Resend. |
| 7 | **Stripe subscription billing** | Free tier covers the dashboard and campaign visibility. Pro tier ($29/mo) unlocks campaign approval, auto-approve, restock alerts, and cart recovery. A webhook keeps the plan in sync with the actual Stripe subscription state. |
| 8 | **Idempotent webhook processing** | Every incoming Shopify webhook is checked against a `ProcessedEvent` collection before being acted on, so Shopify's automatic retries never cause duplicate orders, duplicate discounts, or duplicate emails. |

---

## How It Works — User Journey

```
1. Merchant lands on the login page
        │
        ▼
2. Clicks "Connect with Shopify" (or "View live demo" to explore with sample data)
        │
        ▼
3. Approves permissions on Shopify's OAuth consent screen
        │
        ▼
4. Redirected back to Storiq with a signed JWT — store record created in MongoDB
        │
        ▼
5. Dashboard loads — 30-day revenue chart, AI summary, top products
        │
        ▼
6. Every night at 2 AM UTC, a background worker:
   • Recalculates sales velocity per product
   • Detects slow movers and asks Gemini for discount recommendations
   • Checks inventory levels for restock alerts
   • Regenerates the AI dashboard summary
        │
        ▼
7. Merchant reviews pending campaigns → approves → Storiq creates
   the real discount code on Shopify automatically
        │
        ▼
8. A customer abandons a cart on the merchant's store → Shopify sends
   a webhook → Storiq waits 1 hour → sends a personalized recovery email
   if the cart still hasn't converted
        │
        ▼
9. Merchant upgrades to Pro via Stripe Checkout to unlock full automation
```

---

## Tech Stack

### Frontend
- **React 18** + **Vite** — fast dev server and build tooling
- **React Router** — client-side routing (Dashboard, Campaigns, Alerts, Billing, Contact)
- **TanStack Query** — server-state data fetching, caching, and auto-refresh
- **Recharts** — revenue line charts
- **lucide-react** — icon set
- Custom design system using CSS variables (no Tailwind in the final UI — hand-built neutral palette)

### Backend
- **Node.js** + **Express** — REST API
- **MongoDB** + **Mongoose** — multi-tenant data store
- **Bull** + **Redis** — background job queues (analytics, campaign, email, webhook)
- **node-cron** — nightly and morning scheduled jobs
- **JWT** — stateless authentication

### AI
- **Google Gemini 2.5 Flash** — dashboard summaries, campaign discount recommendations, abandoned cart email personalization (free tier, structured JSON output mode)

### Integrations
- **Shopify REST Admin API + Webhooks** — OAuth, orders, products, inventory, price rules, discount codes
- **Stripe** — Checkout, subscriptions, billing portal, webhooks
- **Resend** — transactional email delivery (recovery emails, restock alerts)

### DevOps / Infrastructure
- **Railway** — hosts the API service, the background worker service, and managed Redis
- **MongoDB Atlas** — managed database (M0 free tier)
- **Vercel** — hosts the React frontend, auto-deploys on push
- **GitHub** — version control, triggers Railway + Vercel auto-deploys
- **Docker** — multi-stage Dockerfile (same image runs both API and worker via different start commands)

---

## System Architecture

```
                            ┌─────────────────────┐
                            │   Browser (User)    │
                            └──────────┬───────────┘
                                       │ HTTPS
                                       ▼
                            ┌─────────────────────┐
                            │  Vercel (Frontend)  │
                            │  React + Vite SPA   │
                            └──────────┬───────────┘
                                       │ REST API calls (JWT)
                                       ▼
                  ┌────────────────────────────────────────┐
                  │         Railway — API Service          │
                  │   Express · Auth · Routes · Webhooks    │
                  └───────┬───────────────────┬─────────────┘
                          │                   │
              reads/writes│                   │ enqueues jobs
                          ▼                   ▼
                 ┌─────────────────┐  ┌─────────────────┐
                 │  MongoDB Atlas  │  │     Redis        │
                 │ (multi-tenant)  │  │  (Bull queues)    │
                 └─────────────────┘  └────────┬─────────┘
                                                │ processes jobs
                                                ▼
                                   ┌──────────────────────────┐
                                   │  Railway — Worker Service │
                                   │  Analytics · Campaign ·   │
                                   │  Email · Webhook          │
                                   │  processors + cron        │
                                   └─────┬──────┬──────┬───────┘
                                         │      │      │
                              ┌──────────┘      │      └───────────┐
                              ▼                 ▼                  ▼
                     ┌────────────────┐ ┌──────────────┐  ┌─────────────────┐
                     │  Google Gemini │ │ Shopify REST │  │     Resend       │
                     │   (AI calls)   │ │  + Webhooks  │  │ (email delivery) │
                     └────────────────┘ └──────────────┘  └─────────────────┘

                     Stripe sits alongside the API service for Checkout,
                     subscription webhooks, and the billing portal.
```

**Two Railway services run from the same codebase:**
- **API service** — handles HTTP requests, OAuth, webhooks, billing. Has a public domain.
- **Worker service** — same repo, different start command (`node apps/worker/src/worker.js`). No public domain — connects only to MongoDB and Redis.

---

## Project / Folder Structure

```
shopify-autopilot/
├── apps/
│   ├── api/                          # Express API server (Railway service #1)
│   │   ├── src/
│   │   │   ├── app.js                # Express app setup, middleware, routes
│   │   │   ├── server.js             # Entry point — starts HTTP server
│   │   │   ├── config/
│   │   │   │   ├── db.js             # MongoDB connection with retry logic
│   │   │   │   └── env.js            # Centralized environment variable access
│   │   │   ├── middleware/
│   │   │   │   ├── tenant.js         # JWT verification + tenant context injection
│   │   │   │   ├── planGate.js       # Blocks Pro features for Free-tier tenants
│   │   │   │   └── error.js          # Centralized error handler
│   │   │   ├── routes/
│   │   │   │   ├── auth.js           # Shopify OAuth + JWT issuing + demo login
│   │   │   │   ├── dashboard.js      # Dashboard metrics + AI summary endpoint
│   │   │   │   ├── campaigns.js      # Campaign list/detect/approve/reject
│   │   │   │   ├── alerts.js         # Restock alerts + abandoned cart stats
│   │   │   │   ├── billing.js        # Stripe checkout/portal/webhook
│   │   │   │   ├── webhooks.js       # Shopify webhook receiver
│   │   │   │   └── admin.js          # Bull Board (dev-only job monitor)
│   │   │   └── services/
│   │   │       ├── shopify.js        # Shopify REST client + HMAC verification
│   │   │       ├── ai.js             # Dashboard AI summary via Gemini
│   │   │       └── stripeService.js  # Checkout/portal/webhook logic
│   │   ├── scripts/
│   │   │   └── seed.js               # Seeds demo store with sample data
│   │   ├── Dockerfile                # Multi-stage build, shared by API + worker
│   │   └── package.json
│   │
│   ├── worker/                       # Bull queue worker (Railway service #2)
│   │   └── src/
│   │       ├── worker.js             # Entry point — registers processors + cron
│   │       └── processors/
│   │           ├── analytics.js      # Nightly velocity calc + restock check
│   │           ├── campaign.js       # Shopify price rule sync + ROI tracking
│   │           ├── email.js          # Abandoned cart recovery email dispatch
│   │           └── webhook.js        # Processes queued Shopify webhook events
│   │
│   └── web/                          # React frontend (Vercel)
│       └── src/
│           ├── App.jsx               # Route definitions
│           ├── main.jsx              # React + TanStack Query bootstrap
│           ├── index.css             # Design tokens (CSS variables), fonts
│           ├── lib/
│           │   └── apiClient.js      # Axios instance with JWT interceptor
│           ├── components/
│           │   ├── Layout.jsx        # Sidebar nav, mobile menu, footer
│           │   └── ui.jsx            # Card, Badge, Spinner, PageHeader, EmptyState
│           └── pages/
│               ├── Login.jsx         # Shopify connect + demo login
│               ├── Dashboard.jsx     # Charts, AI summary, top products, alerts
│               ├── Campaigns.jsx     # Pending/active/history campaign cards
│               ├── Alerts.jsx        # Restock urgency tiers + cart stats
│               ├── Billing.jsx       # Free vs Pro plan comparison + Stripe
│               └── Contact.jsx       # Organization contact details
│
├── packages/
│   └── shared/                       # Imported by BOTH apps/api and apps/worker
│       ├── models/                   # Mongoose schemas (Store, Order, Product,
│       │                             #   Campaign, CartEvent, ProcessedEvent, AiSummary)
│       ├── plugins/
│       │   └── tenantPlugin.js       # Auto-injects tenantId into every query
│       ├── queues/
│       │   └── index.js              # Bull queue definitions (analytics, campaign,
│       │                             #   email, webhook)
│       └── services/
│           ├── campaignAi.js         # Campaign discount recommendations via Gemini
│           ├── cartAi.js             # Recovery email generation via Gemini
│           ├── campaignService.js    # Detection, approval, Shopify sync, ROI
│           ├── restockService.js     # Inventory velocity alert logic
│           ├── emailService.js       # Resend wrapper with dev-mode fallback
│           └── shopify.js            # Shared Shopify API client getter
│
├── docker-compose.yml                 # Local dev: Mongo + Redis + API + Worker
├── docker-compose.prod.yml            # Production reference compose file
├── .env.example                       # Template for all required env vars
└── package.json                       # npm workspaces root
```

---

## Data Models

| Model | Purpose | Key fields |
|-------|---------|-----------|
| **Store** | One record per connected Shopify store (tenant) | `tenantId`, `accessToken` (hidden by default), `plan`, `stripeCustomerId` |
| **Order** | Synced from Shopify via webhook | `tenantId`, `shopifyOrderId`, `totalPrice`, `lineItems`, `discountCodes` |
| **Product** | Synced from Shopify, enriched nightly | `tenantId`, `velocityPerDay`, `unitsSold7d/30d`, `daysUntilStockout` |
| **Campaign** | AI-detected discount opportunity | `productId`, `discountPct`, `confidenceScore`, `status`, `shopifyPriceRuleId` |
| **CartEvent** | Tracks a Shopify cart for abandonment detection | `shopifyCartId`, `customerEmail`, `converted`, `recoveryEmailSent` |
| **ProcessedEvent** | Idempotency guard for webhooks | `eventId` (unique), `topic`, TTL-expires after 30 days |
| **AiSummary** | 24-hour cache of the Gemini dashboard summary | `tenantId` (unique), `summary`, `topInsight`, `alerts`, `expiresAt` |

Every model except `ProcessedEvent` carries a `tenantId` field, and a global Mongoose plugin (`packages/shared/plugins/tenantPlugin.js`) automatically scopes every query to the current tenant using Node's `AsyncLocalStorage` — set once by the auth middleware at the start of each request.

---

## API Reference

```
GET  /health                          Server health check
GET  /                                  API info

# Auth
GET  /api/auth/shopify                Start Shopify OAuth flow
GET  /api/auth/shopify/callback       Complete OAuth, issue JWT, register webhooks
GET  /api/auth/me                     Current authenticated store info
POST /api/auth/dev-token              Demo login (production-safe, demo store only)

# Dashboard
GET  /api/dashboard                   Revenue chart, metrics, AI summary
GET  /api/dashboard/stats             Lightweight stats for header cards
POST /api/dashboard/refresh-ai        Force-regenerate the cached AI summary

# Campaigns
GET  /api/campaigns                   List campaigns grouped by status
POST /api/campaigns/detect            Trigger AI slow-product detection
POST /api/campaigns/:id/approve       Approve + queue Shopify sync (Pro only)
POST /api/campaigns/:id/reject        Reject a pending campaign

# Alerts
GET  /api/alerts/restock              Products grouped by stockout urgency
GET  /api/alerts/abandoned-carts      7-day cart conversion + recovery stats

# Billing
GET  /api/billing/status              Current plan + feature flags
POST /api/billing/checkout            Create Stripe Checkout session
POST /api/billing/portal              Open Stripe customer billing portal
POST /api/billing/webhook             Stripe webhook receiver (raw body)

# Webhooks
POST /api/webhooks/shopify            Shopify webhook receiver (HMAC verified)
```

All routes except `/health`, `/api/auth/shopify*`, `/api/auth/dev-token`, and the two webhook receivers require a `Authorization: Bearer <jwt>` header.

---

## Background Jobs

| Queue | Job | Trigger | What it does |
|-------|-----|---------|---------------|
| `analytics` | `nightly-analysis` | Cron, 2 AM UTC daily | Recalculates `velocityPerDay`, `unitsSold7d/30d`, `daysUntilStockout` for every product; expires the cached AI summary |
| `analytics` | `restock-check` | Cron, 8 AM UTC daily | Finds products within 30 days of stockout, sends an email alert |
| `campaign` | `detect-campaigns` | Cron (nightly) or manual `/detect` call | Asks Gemini for discount recommendations on slow movers, creates pending `Campaign` records |
| `campaign` | `sync-to-shopify` | After a campaign is approved | Creates a real Shopify price rule + discount code via REST API |
| `campaign` | `check-roi` | Manual / scheduled | Matches paid orders against a campaign's discount code to compute revenue generated |
| `email` | `abandoned-cart` | Delayed 1 hour after `carts/create` webhook | Re-checks the cart hasn't converted, generates a personalized email via Gemini, sends via Resend |
| `webhook` | `order` / `cart` / `inventory` / `uninstall` | Incoming Shopify webhooks | Idempotently processes each Shopify event type |

All jobs use exponential backoff (3 attempts: 5s → 10s → 20s) and are visible in Bull Board at `/admin/queues` in development.

---

## Key Architecture Decisions

**Multi-tenancy is enforced at the database layer, not by convention.**
A Mongoose plugin reads the current tenant from `AsyncLocalStorage` (set by the auth middleware) and silently adds a `tenantId` filter to every query. A developer cannot accidentally leak another tenant's data by forgetting a `where` clause.

**The API and worker are two Railway services from one Docker image.**
Same codebase, same dependencies, different start command. This guarantees the worker is never running stale code relative to the API, and halves the CI build effort.

**Webhooks respond `200` immediately, then process asynchronously.**
Shopify times out at 5 seconds and retries on failure. By acknowledging instantly and queuing the real work in Bull, slow database writes or AI calls never cause Shopify to retry — which would otherwise risk duplicate processing.

**Every webhook is deduplicated via a `ProcessedEvent` record written before queuing.**
This makes the system safe against Shopify's automatic retry behavior — a retried `orders/paid` event will never create a duplicate order, double-send a recovery email, or double-trigger a discount.

**The AI never sees raw, individual records — only aggregates.**
Dashboard prompts contain totals, averages, and per-product velocity numbers, never customer emails or individual order line items. This is both a privacy boundary and a cost control (aggregated data is far smaller in token count than raw order history).

**The dashboard AI summary is cached for 24 hours.**
Without caching, opening the dashboard repeatedly would trigger a paid/rate-limited AI call on every page load. The cache means one Gemini call per store per day, with a manual "Refresh" override available.

**Campaign approval is human-in-the-loop by default, with an opt-in autopilot.**
Pro-tier campaigns with a Gemini confidence score ≥ 0.85 can auto-approve; everything else requires a merchant click before touching the real Shopify store. This builds trust in an automation feature that otherwise changes live pricing.

---

## User Guide

### For a visitor with no Shopify store (e.g. a recruiter)

1. Open the live demo link
2. Click **"View live demo — no signup needed"**
3. You're instantly logged into a shared, fully-seeded **demo-store** tenant (Pro plan, 30 days of realistic data)
4. Explore:
   - **Dashboard** — revenue chart, AI-generated summary, top products, restock alerts
   - **Campaigns** — one pending campaign (try Approve/Reject), one active campaign with revenue tracked, one completed campaign
   - **Alerts** — restock urgency tiers and abandoned cart recovery stats
   - **Billing** — plan comparison (the demo store is already on Pro)
   - **Contact** — organization details

### For a real Shopify merchant

1. On the login page, enter your store's `.myshopify.com` URL
2. Click **Connect** — you're redirected to Shopify's own permission screen
3. Approve the requested scopes (orders, products, inventory, price rules)
4. You're redirected back to your dashboard, now connected to your real store
5. Storiq automatically registers webhooks for orders, carts, inventory, and app uninstall
6. The first AI summary generates once enough order history exists; campaigns and restock alerts populate after the first nightly job run
7. Upgrade to Pro from the **Billing** page to unlock campaign approval, restock email alerts, and abandoned cart recovery

---

## Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/UmairWarind2000/Storiq.git
cd shopify-autopilot
npm install --workspaces

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Start MongoDB + Redis locally
docker compose up mongo redis -d

# 4. Start the API
npm run dev:api

# 5. Start the worker (new terminal)
npm run dev:worker

# 6. Start the frontend (new terminal)
npm run dev:web

# 7. (Optional) Seed demo data
cd apps/api && node scripts/seed.js
```

Visit `http://localhost:5173`, click **Dev login**, and explore the locally-seeded dashboard.

---

## Environment Variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `NODE_ENV` | API, Worker | `development` or `production` |
| `PORT` | API | HTTP port (Railway sets this automatically) |
| `MONGODB_URI` | API, Worker | MongoDB Atlas connection string |
| `REDIS_URL` | API, Worker | Redis connection string (Bull queues) |
| `JWT_SECRET` | API | Signs and verifies session JWTs |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | API | Shopify Partner app credentials |
| `SHOPIFY_SCOPES` | API | Requested OAuth permissions |
| `APP_URL` | API | Public API URL (OAuth redirect base) |
| `FRONTEND_URL` | API, Worker | Public frontend URL (post-OAuth redirect, email links) |
| `GEMINI_API_KEY` | API, Worker | Google Gemini API key (AI features) |
| `STRIPE_SECRET_KEY` | API | Stripe server-side key |
| `STRIPE_WEBHOOK_SECRET` | API | Verifies Stripe webhook signatures |
| `STRIPE_PRO_PRICE_ID` | API | Price ID for the $29/mo Pro plan |
| `RESEND_API_KEY` | API, Worker | Resend email delivery |
| `RESEND_FROM_EMAIL` | API, Worker | Verified sender address |
| `ALERT_EMAIL` | Worker | Destination for restock alert emails |
| `VITE_API_URL` | Frontend (Vercel) | Public backend API URL — **the only variable the frontend needs** |

Secrets are never exposed to the frontend — only `VITE_API_URL` (a public URL, not a secret) is set in Vercel.

---

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| API service | Railway | Public domain, start command `node apps/api/src/server.js` |
| Worker service | Railway | No public domain, start command `node apps/worker/src/worker.js` |
| Redis | Railway | Internal-only, referenced via `${{Redis.REDIS_URL}}` |
| MongoDB | MongoDB Atlas | M0 free tier |
| Frontend | Vercel | Auto-deploys on push to `main`, root directory `apps/web` |

Both Railway services and Vercel auto-redeploy on every push to the `main` branch.

---

## Pricing Model

| | Free | Pro — $29/month |
|---|---|---|
| AI sales dashboard | ✅ | ✅ |
| Revenue charts | ✅ | ✅ |
| Campaign detection (view only) | ✅ | ✅ |
| Campaign approval & Shopify sync | ❌ | ✅ |
| Auto-approve high-confidence campaigns | ❌ | ✅ |
| Restock email alerts | ❌ | ✅ |
| Abandoned cart recovery emails | ❌ | ✅ |
| Stripe billing portal access | ✅ | ✅ |

---

## Contact

**Organization:** Storiq
**Email:** umairwarind360@gmail.com
**Phone:** 0302 129 6089

---

*Built end-to-end as a full-stack portfolio project demonstrating multi-tenant SaaS architecture, AI integration, background job processing, third-party OAuth, and production deployment across Railway, Vercel, and MongoDB Atlas.*