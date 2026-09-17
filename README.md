# E-Commerce App

A simple educational e-commerce web application built as a university project.

## Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Laravel
- **Database:** Microsoft SQL Server (MSSQL)
- **Authentication:** Laravel Sanctum (API bearer tokens)

## Roles

- **Admin** — manages users, businesses, categories; can inspect all products and orders.
- **Seller** — belongs to one business; manages that business's products, images, and fulfillment status on relevant order items.
- **Customer** — browses active products, views product details, and places simple orders.

## Scope

- Products
- Categories
- Businesses (seller workplaces)
- Product images
- Orders (simple order creation, no checkout flow)

**Payment integration: NOT INCLUDED**
**Shipping/cargo integration: NOT INCLUDED**

This is intentionally a simple system for coursework purposes — there is no payment provider, no credit card handling, no shipping provider, and no cargo tracking.

## Project structure

```
ecommerce-app/
  backend/   Laravel API application
  frontend/  React + TypeScript + Vite application
```

## Demo data (development only)

Seeded via `php artisan migrate:fresh --seed` in `backend/`. **Do not use these credentials outside local development.**

| Role     | Email                | Password       |
|----------|-----------------------|----------------|
| Admin    | admin@shop.local      | Password123!   |
| Seller   | seller@shop.local     | Password123!   |
| Customer | customer@shop.local   | Password123!   |

Also seeded: one demo business ("Tekno Mağaza"), 4 categories, and 12 demo products — each with one locally-generated placeholder image (see Image storage below).

## Backend setup

Prerequisites: PHP 8.3+ with the `sqlsrv`/`pdo_sqlsrv` extensions, Composer,
and a running SQL Server instance (this project was built and tested
against SQL Server Express, instance `(local)\SQLEXPRESS`, using **Windows
Integrated Authentication** — no SQL login/password needed).

1. Create the database (safe to re-run):

   ```
   sqlcmd -S "(local)\SQLEXPRESS" -E -C -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ecommerce_app') CREATE DATABASE ecommerce_app;"
   ```

2. Install dependencies and configure the app:

   ```
   cd backend
   composer install
   copy .env.example .env
   php artisan key:generate
   ```

   `backend/.env.example` already defaults `DB_HOST` to `(local)\SQLEXPRESS`
   and `DB_DATABASE` to `ecommerce_app` with empty `DB_USERNAME`/`DB_PASSWORD`
   (Windows Integrated Authentication). If your SQL Server instance name or
   auth method differs, adjust those values in `.env` only — never commit them.

3. Run migrations, seed demo data, and link storage:

   ```
   php artisan migrate:fresh --seed
   php artisan storage:link
   ```

4. Start the backend:

   ```
   php artisan serve
   ```

   The API is now reachable at `http://127.0.0.1:8000` (health check: `/up`).

## Frontend setup

```
cd frontend
npm install
copy .env.example .env   # VITE_API_BASE_URL defaults to http://127.0.0.1:8000/api
npm run dev
```

The dev server runs at `http://localhost:5173`. The backend's CORS config
(`backend/config/cors.php`) explicitly allows `http://localhost:5173` and
`http://127.0.0.1:5173` — not a wildcard — since the frontend needs to send
an `Authorization: Bearer <token>` header cross-origin.

### Windows note: multipart image uploads via `php artisan serve`

If your Windows user folder name contains a non-ASCII character (e.g. a
Turkish İ/ı/ş/ğ), PHP's built-in dev server can fail image uploads with
*"unable to create a temporary file"*, because it resolves the OS temp
directory through that same non-ASCII path. This is a local PHP/OS quirk,
not an application bug — the code never assumes anything about the temp
directory. If you hit this, start the server pointed at any ASCII-only
temp folder instead of `php artisan serve`:

```
mkdir C:\phptemp        REM any ASCII-only folder works, created outside the repo
cd backend\public
php -d upload_tmp_dir=C:\phptemp -S 127.0.0.1:8000 ..\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php
```

No application code, config file, or committed path depends on `C:\phptemp` —
it's purely a local `php -d` flag you pass yourself, so nothing machine-specific
is ever checked in.

### Local URLs

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://127.0.0.1:8000        |
| Backend health check | http://127.0.0.1:8000/up |

## Frontend features (Phase 3)

React + TypeScript, plain custom CSS (no UI framework), React Router,
Axios, `lucide-react` icons. All screens consume the real backend API —
nothing is hardcoded or mocked.

**Customer** (public + `role: customer`)
- Catalog (`/`) with search, category/price/in-stock filters, pagination
- Product detail (`/products/:id`) with image gallery and quantity selector
- Cart (`/cart`) — client-side only (localStorage), display totals are
  estimates; order creation (`POST /api/orders`) is what actually prices
  and validates everything server-side
- Order creation from the cart page (note field only — no payment/shipping
  fields exist anywhere in the UI)
- Own orders list/detail (`/orders`, `/orders/:id`) with Turkish status
  labels (Sipariş Alındı / Hazırlanıyor / Tamamlandı / İptal Edildi)

**Seller / İş Yeri** (`/seller`, `role: seller`)
- Dashboard: product/order counts derived from the real list endpoints
  (no separate stats endpoint was added)
- Product list with search/category/status filters, create/edit/soft-delete
- Product image management: upload (jpg/jpeg/png/webp, 5MB max, with a
  local preview before upload), set primary, edit alt text, delete (with
  primary auto-promotion mirroring the backend rule)
- Orders: only order items belonging to the seller's own business are ever
  shown; status actions are limited to the backend's allowed transitions
  (`received→preparing→completed`, cancel from either), with a confirmation
  dialog before cancelling

**Admin / Yönetici** (`/admin`, `role: admin`)
- Dashboard: user/business/category/product/order totals from the real
  paginated endpoints
- Users: list/search/filter, create/edit (role, business assignment,
  password reset), self-deactivate/self-demote disabled in the UI as a
  convenience (the backend enforces this regardless)
- Businesses & Categories: list/search/filter, create/edit,
  activate/deactivate — no hard-delete button exists
- Products: read-only inspection across every business, with a "show
  deleted" toggle
- Orders: read-only inspection with detail view (customer, all items,
  business names, snapshots, statuses, total)

Role-based routing (`RoleRoute`/`ProtectedRoute`) is a UX convenience only
— a customer is redirected away from `/admin`, etc. — the Laravel backend
remains the actual security boundary for every request.

## Backend API (Phase 2)

All endpoints are versionless JSON under `/api`, authenticated with a Sanctum bearer token (`Authorization: Bearer <token>`) except the public catalog and `/api/login`.

**Admin** (`/api/admin/...`, role `admin`)
- Businesses: list/search/filter, create, update, activate/deactivate (no hard delete)
- Categories: list/search/filter, create, update, activate/deactivate (no hard delete)
- Users: list/search/filter, create, update role/business/password/active state (no hard delete)
- Products: read-only inspection across every business (`/admin/products`)
- Orders: read-only inspection across every customer (`/admin/orders`)

**Seller** (`/api/seller/...`, role `seller`, own business only)
- Products: full CRUD (`/seller/products`), delete is soft-delete only
- Product images: upload / reorder / set primary / delete (`/seller/products/{product}/images/...`)
- Orders: view orders containing their own business's items (`/seller/orders`)
- Order items: transition status (`PATCH /seller/order-items/{orderItem}/status`)

**Customer** (role `customer`)
- Catalog browsing is public: `GET /api/catalog/products`, `GET /api/catalog/products/{product}`, `GET /api/catalog/categories`
- `POST /api/orders` — create an order (server calculates all prices/totals; the client only sends `product_id` + `quantity` pairs and an optional note)
- `GET /api/orders`, `GET /api/orders/{order}` — the customer's own orders only

A seller whose business has been deactivated by an admin keeps their login, but every `/api/seller/...` route is blocked (403) until the business is reactivated.

### Order statuses

Both an order and each of its line items carry one of: `received`, `preparing`, `completed`, `cancelled`. Item transitions are limited to `received → preparing → completed` or a cancellation from either `received` or `preparing`; `completed` and `cancelled` are terminal. Cancelling an item (for the first time only) restores its quantity back onto the product's stock.

Because a single order can contain items from several businesses, the order's own status is *derived* from its items' statuses (`App\Services\OrderStatusService`), not set directly:

1. If **any** item is `preparing` → order is `preparing`.
2. Else if **all** items are `cancelled` → order is `cancelled`.
3. Else if any remaining (non-cancelled) item is `received` → order is `received`.
4. Otherwise (every remaining non-cancelled item is `completed`) → order is `completed`.

### Image storage

Product images are uploaded through `multipart/form-data` (`image` field, jpg/jpeg/png/webp only, 5&nbsp;MB max) and stored via Laravel's `public` filesystem disk (`storage/app/public/products/{business_id}/{product_id}/...`), never as database BLOBs. Run `php artisan storage:link` once so `public/storage` resolves to that directory. Uploaded filenames are always server-generated (never taken from client input), so there is no path-traversal or arbitrary-destination risk. Demo product placeholder images are drawn locally at seed time (`ProductImageSeeder`, using PHP's GD extension) — no external hotlinks and no third-party product photos are used.

## Status

Complete: foundation & schema, full backend API, complete React + TypeScript
frontend (customer storefront, seller panel, admin panel), and final QA.
Published to GitHub.
