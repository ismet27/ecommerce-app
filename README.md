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

Also seeded: one demo business ("Tekno Mağaza"), 4 categories, and 12 demo products.

## Backend setup

```
cd backend
composer install
copy .env.example .env   # then fill in local DB connection details
php artisan key:generate
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

## Status

Phase 1 (foundation, schema, authentication) is complete. Product/category/business CRUD APIs, image uploads, order creation, and the React admin/seller/storefront UIs are implemented in later phases.
