# Duka Manager

A SaaS inventory and sales tracker built for small Kenyan shops (dukas). Duka Manager gives shop owners and staff realtime visibility into stock, sales, and profits without needing accounting knowledge.

---

## Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Framework  | Next.js 16 (App Router)               |
| Language   | TypeScript                            |
| Styling    | Tailwind CSS v4                       |
| Database   | PostgreSQL                            |
| ORM        | Prisma 7 + `@prisma/adapter-pg`       |
| Auth       | `jose` JWT (Edge-compatible)          |
| Validation | Zod                                   |
| Forms      | react-hook-form + @hookform/resolvers |
| State      | Zustand                               |
| Charts     | Recharts                              |
| HTTP       | Axios                                 |
| Dates      | date-fns                              |
| Passwords  | bcryptjs                              |

---

## Features

### Auth

- Register with shop creation (owner account + shop in one transaction)
- Login with JWT access token (15min) + httpOnly refresh token cookie (7 days)
- Silent token refresh via axios interceptor and on page reload
- Edge compatible middleware protects all `/api/*` routes except public auth endpoints
- Page level auth guard in middleware — redirects logged in users away from `/login` and `/register`, redirects unauthenticated users away from protected pages

### Inventory

- Full product CRUD — create, read, update, soft delete
- SKU/barcode support with upsert logic (restock existing product on duplicate SKU)
- Categories with hex color labels
- Per product low stock threshold with shop-level default fallback (5 units)
- Stock movement audit trail (`StockMovement` table) every change is recorded
- `stockQty` on `Product` is a denormalized cache for fast reads

### Point of Sale (POS)

- Searchable product grid — out of stock items disabled
- Cart with quantity controls, stock ceiling enforcement, clear all
- Payment methods — CASH, MPESA, CARD
- M-Pesa reference field (conditional)
- Discount support (owner/manager only)
- Live change calculation
- Atomic sale creation — stock deducted and audit trail written in a single transaction
- Receipt number generation — `DK-YYYYMMDD-XXXX`
- Receipt modal on successful sale
- Product grid refreshes after sale to show updated stock

### Reports

- Daily, weekly, monthly period selector with date navigation
- Metric cards — revenue, gross profit, COGS, transactions, discounts
- Top 5 products bar chart (by quantity sold)
- Sales table for the selected period
- Report caching in `Report` table invalidated automatically on every new sale
- Stale report detection (1 hour expiry) with automatic regeneration

### Overview Dashboard

- Today's revenue and sales count
- Weekly gross profit
- Low stock alert count
- Recent sales table (today)
- Top products bar chart (weekly)
- Low stock alerts section

### Multi-tenancy

- `Shop` is the root tenant — all data is scoped by `shopId`
- Users can belong to multiple shops via `ShopUser` junction table
- Three roles: `OWNER`, `MANAGER`, `CASHIER`
- Role-based access enforced on both API and UI layers

---

## Project Structure

```
src/
  app/
    api/
      auth/         # login, register, refresh, logout, me
      products/     # CRUD + [id]
      sales/        # create, list + [id]
      reports/      # get/generate report
      categories/   # list, create + [id] delete
    (auth)/
      login/
      register/
    (dashboard)/
      overview/     # overview dashboard
      inventory/    # product management
      pos/          # point of sale
      reports/      # sales reports
  lib/
    prisma.ts       # Prisma client singleton
    auth.ts         # register, login, refresh, authMe
    inventory.ts    # product service
    sales.ts        # sale service
    reports.ts      # report service with caching
    categories.ts   # category service
    axios.ts        # axios instance with silent refresh interceptor
    error.ts        # AppError class
    helpers/
      request.ts    # apiResponse, apiError, getUserId
    validation/
      auth.ts
      product.ts
      sale.ts
      category.ts
  store/
    useAuthStore.ts # Zustand auth store (token, user, shopId, role)
  components/
    Sidebar.tsx
    Topbar.tsx
    ProtectedRoute.tsx
  middleware.ts     # API protection + page-level auth guard
```

---

## Architecture Decisions

### JWT Strategy

- Access token lives in Zustand memory only never in localStorage or a cookie
- Refresh token lives in an httpOnly cookie inaccessible to JavaScript
- Silent refresh: on page reload, `ProtectedRoute` calls `/api/auth/refresh` → gets new access token → calls `/api/auth/me` → restores full session (user, shopId, role)
- Axios response interceptor handles 401s queues failed requests, refreshes token, retries all queued requests

### Error Handling

- `AppError` class with `statusCode` for consistent API errors
- `apiResponse` and `apiError` helpers in `src/lib/helpers/request.ts`
- All routes return `{ success, data, error }` envelope

### Stock Management

- `stockQty` on `Product` is a denormalized cache for fast reads
- `StockMovement` is the append only source of truth
- Every stock change (sale, restock, adjustment) writes a `StockMovement` row
- Sales deduct stock atomically in a Prisma transaction

### Report Caching

- Reports are pre aggregated and stored in the `Report` table
- Cache is invalidated on every `createSale` call, `report.deleteMany` runs after the transaction commits
- Stale reports (older than 1 hour) are deleted and regenerated on next request
- Raw SQL used for COGS calculation (`SUM(buyingPrice * quantity)`)

### Role-based Access

- API: `memberShipVerification` checks `ShopUser` on every service call
- CASHIER role blocked from create/update/delete on products
- UI: `role` stored in Zustand discount field and action buttons hidden for cashiers

---

## Pricing

| Plan  | Price           |
| ----- | --------------- |
| Free  | KES 0/month     |
| Basic | KES 500/month   |
| Pro   | KES 1,500/month |

---

## Design System

- Primary green: `#1D9E75` (M-Pesa green)
- Sidebar dark green: `#085041`
- Tailwind v4 with `@theme inline` — CSS variables mapped to utility classes (`bg-primary`, `bg-sidebar`, etc.)
- Light and dark mode supported — preference saved in `localStorage`

---

## Roadmap (V2)

- Customer credit and prepay (milk accounts)
- Supplier management
- Delivery/restock logging
- Multi-branch support
- Background report generation job
- Stripe billing integration
