# Duka Manager

A SaaS inventory and sales tracker built for small Kenyan shops (dukas). Duka Manager gives shop owners and staff real-time visibility into stock, sales, and profit — without needing accounting knowledge.

> **Current version:** v1.1.0

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Auth | `jose` JWT (Edge-compatible) |
| Validation | Zod |
| Forms | react-hook-form + @hookform/resolvers |
| State | Zustand |
| Charts | Recharts |
| HTTP | Axios |
| Dates | date-fns |
| Passwords | bcryptjs |

---

## Features

### Auth
- Register with shop creation — owner account + shop created in one transaction
- Login with JWT access token (15min) + httpOnly refresh token cookie (7 days)
- Silent token refresh via axios interceptor and on page reload
- Edge-compatible middleware — protects all `/api/*` routes except public auth endpoints
- Page-level auth guard in middleware — redirects logged-in users away from `/login` and `/register`, redirects unauthenticated users away from protected pages

### Overview Dashboard
- Today's revenue and sales count
- Weekly gross profit
- Low stock alert count
- Recent sales table (today)
- Top products bar chart (weekly)
- Low stock alerts section with per-product threshold support

### Inventory
- Full product CRUD — create, read, update, soft delete
- SKU/barcode support with upsert logic (restock existing product on duplicate SKU)
- Categories with hex color labels
- Per-product low stock threshold with shop-level default fallback
- Stock movement audit trail — every change recorded in `StockMovement`
- Client-side search by name or SKU
- Category filter dropdown
- Role-based access — CASHIER gets read-only view

### Point of Sale (POS)
- Searchable product grid — out-of-stock items disabled
- Cart with quantity controls, stock ceiling enforcement, clear all
- Payment methods — CASH, MPESA, CARD
- M-Pesa reference field (conditional on MPESA selection)
- Discount support (owner/manager only)
- Live change calculation with short-payment indicator
- Atomic sale creation — stock deducted and audit trail written in one transaction
- Receipt number generation — `DK-YYYYMMDD-XXXX`
- Receipt modal on successful sale
- Product grid auto-refreshes after sale to show updated stock quantities

### Reports
- Daily, weekly, monthly period selector with date navigation
- Metric cards — revenue, gross profit, COGS, transactions, discounts
- Top 5 products bar chart (by quantity sold)
- Sales table for the selected period
- Report caching in `Report` table — invalidated automatically on every new sale
- Stale report detection (1-hour expiry) with automatic regeneration

### Staff Management
- Owner can add cashiers and managers directly (no invite emails)
- Owner creates credentials — name, email, phone, password, role
- Existing email edge case handled — adds user to shop without duplicating the account
- Remove staff — deletes `ShopUser` record only, preserves the user account
- Role badges — OWNER, MANAGER, CASHIER with distinct colors
- Owner cannot remove themselves or other owners
- Staff page restricted to OWNER role — non-owners redirected to overview

### Shop Settings
- Owner can update shop name, location, phone, default low stock threshold
- Shop name updates reactively in topbar without page reload
- Plan and currency displayed (read-only)
- Restricted to OWNER role

### Profile
- Any user can update their name and phone
- Email is read-only (immutable identifier)
- Password change requires current password verification
- Name updates reflect immediately in sidebar

### Multi-tenancy
- `Shop` is the root tenant — all data scoped by `shopId`
- Users can belong to multiple shops via `ShopUser` junction table
- Three roles: `OWNER`, `MANAGER`, `CASHIER`
- Role-based access enforced on both API and UI layers

---

## Project Structure

```
src/
  app/
    api/
      auth/           # login, register, refresh, logout, me
      products/       # CRUD + [id]
      sales/          # create, list + [id]
      reports/        # get/generate report
      categories/     # list, create + [id] delete
      staff/          # list, create + [id] delete
      shop/           # get, update
      profile/        # update profile + password/
    (auth)/
      login/
      register/
    (dashboard)/
      overview/       # overview dashboard
      inventory/      # product management
      pos/            # point of sale
      reports/        # sales reports
      staff/          # staff management (owner only)
      settings/       # shop settings (owner only)
      profile/        # user profile
  lib/
    prisma.ts         # Prisma client singleton
    auth.ts           # register, login, refresh, authMe
    inventory.ts      # product service
    sales.ts          # sale service + report cache invalidation
    reports.ts        # report service with caching
    categories.ts     # category service
    staff.ts          # staff service
    shop.ts           # shop service
    profile.ts        # profile + password service
    axios.ts          # axios instance with silent refresh interceptor
    error.ts          # AppError class
    helpers/
      request.ts      # apiResponse, apiError, getUserId
    validation/
      auth.ts         # login, register, createStaff schemas
      product.ts      # product schemas
      sale.ts         # sale schemas
      category.ts     # category schema
  store/
    useAuthStore.ts   # Zustand — token, user, shopId, role, shopName
  components/
    Sidebar.tsx
    Topbar.tsx
    ProtectedRoute.tsx
  middleware.ts       # API protection + page-level auth guard
```

---

## Architecture Decisions

### JWT Strategy
- Access token lives in Zustand memory only — never in localStorage or a cookie
- Refresh token lives in an httpOnly cookie — inaccessible to JavaScript
- Silent refresh: on page reload, `ProtectedRoute` calls `/api/auth/refresh` → gets new access token → calls `/api/auth/me` → fetches shop details → restores full session (user, shopId, role, shopName)
- Axios response interceptor handles 401s — queues failed requests, refreshes token, retries all queued requests

### Error Handling
- `AppError` class with `statusCode` for consistent API errors
- `apiResponse` and `apiError` helpers in `src/lib/helpers/request.ts`
- All routes return `{ success, data, error }` envelope

### Stock Management
- `stockQty` on `Product` is a denormalized cache for fast reads
- `StockMovement` is the append-only source of truth
- Every stock change (sale, restock, adjustment) writes a `StockMovement` row
- Sales deduct stock atomically in a Prisma transaction

### Report Caching
- Reports are pre-aggregated and stored in the `Report` table
- Cache is invalidated on every `createSale` — `report.deleteMany` runs after the transaction commits
- Stale reports older than 1 hour are deleted and regenerated on next request
- Raw SQL used for COGS calculation (`SUM(buyingPrice * quantity)`)

### Role-based Access
- API: membership verification on every service call, `ownerCheck` for owner-only operations
- CASHIER blocked from create/update/delete on products and all staff/settings endpoints
- UI: `role` in Zustand — restricted UI elements hidden, restricted pages redirect non-owners

---

## Pricing

| Plan | Price |
|---|---|
| Free | KES 0/month |
| Basic | KES 500/month |
| Pro | KES 1,500/month |

---

## Design System

- Primary green: `#1D9E75` (M-Pesa green)
- Sidebar dark green: `#085041`
- Tailwind v4 with `@theme inline` — CSS variables mapped to utility classes (`bg-primary`, `bg-sidebar`, etc.)
- Light and dark mode supported — preference saved in `localStorage`

---

## Changelog

### v1.1.0
- Staff management — owner can add/remove cashiers and managers
- Shop settings — update shop name, location, phone, low stock threshold
- Profile page — update name, phone, change password
- Real shop name in topbar — fetched from DB, reactive on settings update
- Fixed infinite spinner bug in ProtectedRoute
- Fixed report cache staleness — invalidated on every new sale

### v1.0.0
- Initial MVP — auth, inventory, POS, reports, overview dashboard

---

## Roadmap (V2)

- Customer credit and prepay (milk accounts) — schema already in place
- Supplier management — schema already in place
- Delivery and restock logging — schema already in place
- M-Pesa STK Push via Daraja API
- Barcode scanner support on POS
- Export reports to PDF or Excel
- Multi-branch support
- Background report generation job
- Stripe billing integration