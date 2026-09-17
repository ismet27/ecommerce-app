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

```
cd backend
composer install
copy .env.example .env   # then fill in local DB connection details
php artisan key:generate
php artisan storage:link
php artisan migrate:fresh --seed
php artisan serve
```

The backend expects a SQL Server instance reachable at the host configured in `.env` (Windows Integrated Authentication is used by default, so no DB username/password is required locally).

## Frontend setup

```
cd frontend
npm install
npm run dev
```

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

Phase 1 (foundation, schema, authentication) and Phase 2 (complete backend/API — admin, seller, and customer functionality, image uploads, order lifecycle) are complete. The React admin/seller/storefront UI is implemented in Phase 3.
