# Fleet Manager

A clean, mobile-friendly fleet management app for small commercial vehicle operators in the UK. Built with React, Vite, TypeScript, and Tailwind CSS. Backed by Supabase for auth, database, and Edge Functions.

---

## What's included

| Feature | Description |
|---|---|
| **Auth** | Sign up, sign in, sign out via Supabase Auth |
| **Companies** | Each account creates a company; multi-user membership with roles (owner, manager, driver) |
| **Vehicles** | Add, edit, delete vehicles with full compliance and financial tracking |
| **DVLA lookup** | Enter a UK reg plate to auto-fill make, year, MOT and tax expiry |
| **Compliance reminders** | MOT, Tax, Insurance, Service — Overdue / Due soon / OK |
| **Mileage tracker** | Log runs with start/end odometer, auto-calculates distance |
| **Depreciation** | Estimates current market value from mileage and condition |
| **Expenses** | Log costs by category per vehicle |
| **Income** | Log revenue per vehicle and job |
| **Dashboard** | Fleet overview, financials, reminders, per-vehicle summary |
| **Settings** | Profile, company details, integrations catalogue |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Auth | Supabase Auth (email + password) |
| Database | Supabase (Postgres + RLS) |
| Edge Functions | Supabase Edge Functions (Deno) |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-username/fleet-manager.git
cd fleet-manager
npm install
```

### 2. Run in demo mode (no setup needed)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app loads with sample data. Auth is bypassed and data lives in memory only — great for testing the UI.

### 3. Connect Supabase (for real data + auth)

**a) Create a Supabase project** at [supabase.com](https://supabase.com)

**b) Run the schema** — go to your project → SQL Editor → paste and run `supabase/schema.sql`

**c) Add credentials** to your `.env` file:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in: Supabase → your project → Settings → API

**d) Enable email auth** — Supabase → Authentication → Providers → Email → Enable

**e) Restart the dev server**:

```bash
npm run dev
```

You'll now see the sign-in screen. Create an account to get started.

---

## DVLA vehicle lookup

The DVLA lookup uses a Supabase Edge Function as a secure proxy so your API key is never exposed to the browser.

### Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Log in and link your project
supabase login
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy dvla-lookup
```

### Get a DVLA API key

1. Go to [developer-portal.driver-vehicle-licensing.api.gov.uk](https://developer-portal.driver-vehicle-licensing.api.gov.uk)
2. Create a free account
3. Subscribe to the **Vehicle Enquiry Service (VES)** product
4. Copy your API key

### Set the secret

```bash
supabase secrets set DVLA_API_KEY=your_key_here
```

> **Without a key**, the Edge Function returns realistic mock data automatically — so you can develop and test the UI without needing a real key.

---

## Project structure

```
fleet-manager/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── UI.tsx                # Shared UI components
│   │   ├── ProtectedRoute.tsx    # Auth guard
│   │   ├── VehicleModal.tsx      # Add/edit vehicle with DVLA lookup
│   │   ├── VehicleDetail.tsx     # Full vehicle detail view
│   │   └── EntryModals.tsx       # Expense, Income, Mileage log modals
│   ├── hooks/
│   │   ├── useAuth.tsx           # Auth state, sign in/up/out, profile/company
│   │   ├── useApp.tsx            # Fleet data state + Supabase CRUD (company-scoped)
│   │   └── useDvlaLookup.ts      # DVLA Edge Function client hook
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   └── sampleData.ts         # Demo mode seed data
│   ├── pages/
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Vehicles.tsx
│   │   ├── Reminders.tsx
│   │   ├── Mileage.tsx
│   │   ├── Expenses.tsx
│   │   ├── Income.tsx
│   │   └── Settings.tsx          # Profile, company, integrations, account
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   ├── utils/
│   │   └── index.ts              # Depreciation, reminders, formatters
│   ├── App.tsx                   # Layout + routing + auth gating
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── schema.sql                # Full Postgres schema with RLS
│   ├── config.toml               # Supabase local dev config
│   └── functions/
│       └── dvla-lookup/
│           └── index.ts          # DVLA VES proxy Edge Function
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Database & security model

All data is scoped to a **company**, not an individual user. This means:

- One account creates one company
- Multiple staff can be invited to the same company (future: invite flow)
- Every table has `company_id` and Row Level Security policies
- The `is_company_member()` function is the single gatekeeper for all data access
- No user can ever read or write data from a company they don't belong to

### Roles

| Role | Can do |
|---|---|
| `owner` | Everything — delete vehicles, manage integrations, manage members |
| `manager` | Most things — add/edit vehicles, log data, update company details |
| `driver` | Log mileage, expenses, income — read-only on vehicles |

---

## Depreciation formula

```
estimated_value = purchase_price × mileage_retention × condition_multiplier
```

| Mileage | Retention | | Condition | Multiplier |
|---|---|---|---|---|
| < 15k | 92% | | Excellent | ×1.05 |
| 15–30k | 86% | | Good | ×1.00 |
| 30–50k | 80% | | Fair | ×0.88 |
| 50–75k | 72% | | Poor | ×0.72 |
| 75–100k | 63% | | | |
| 100–150k | 54% | | | |
| 150–200k | 44% | | | |
| > 200k | 30% | | | |

---

## Integrations roadmap

The Settings → Integrations page lists all planned connections. Currently live:

- ✅ **DVLA Vehicle Enquiry Service** — reg plate lookup

Coming next:

- 🔜 QuickBooks / Xero — expense and income sync
- 🔜 Jobber / ServiceM8 — job completion → income entry
- 🔜 DVSA MOT History — full MOT history per vehicle
- 🔜 Zapier / Make — no-code automation triggers
- 🔜 Samsara / Verizon Connect — GPS mileage auto-import

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

For Vercel, add a `vercel.json` to handle client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Licence

MIT
