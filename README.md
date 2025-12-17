## Foboh Challenge (v2)

Admin-style web app for managing:

- Products + catalog taxonomy (Category → Subcategory → Segment)
- Pricing profiles (draft → preview → publish) with per-product adjustments

Built with **Next.js App Router**, **shadcn/ui**, **Prisma + Postgres**, **React Hook Form + Zod**, and a small **OpenAPI/Swagger** surface for CRUD.

## Quickstart

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create a local `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
```

Notes:

- `DATABASE_URL` is required (used by `prisma.config.ts` and the Prisma Postgres adapter in `lib/prisma.ts`).
- Any Postgres instance works (local Docker, Supabase, Railway, etc).

### 3) Sync schema to DB

This project uses `prisma db push` for schema sync:

```bash
npm run db:push
```

### 4) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev            # start Next.js dev server
npm run build          # prisma generate && next build
npm run start          # start production server (after build)
npm run lint

npm run db:push        # push Prisma schema to the DB
npm run prisma:generate
```

## App pages

Navigation is provided via the global `AppShell` (top bar + sidebar + mobile drawer).

- **Dashboard**: `/dashboard`
- **Orders**: `/orders` (placeholder)
- **Customers**: `/customers` (placeholder)
- **Products**: `/products`
  - Add product: `/products/add-product`
  - Catalog setup: `/products/catalog-setup`
- **Pricing**: `/pricing`
  - Setup profile (draft): `/pricing/setup-pricing-profile`
  - Preview & publish: `/pricing/setup-pricing-profile/preview/[pricingProfileId]`
- **Freight**: `/freight` (placeholder)
- **Integrations**: `/integrations` (placeholder)
- **Settings**: `/settings` (placeholder)

All routes have loading UI via `loading.tsx` skeletons.

## Pricing model (how it works)

### Draft → Preview → Publish

- Creating a profile stores it as `status = DRAFT` and redirects to the preview page.
- Publishing marks it as `COMPLETED`.

### Based-on logic

Profiles have a `basedOn` field that can point to:

- `globalWholesalePrice` (use the product’s global wholesale price), or
- another Pricing Profile id (inherit pricing from an existing profile).

When inheriting, we follow the based-on chain (with cycle/depth guards) and apply adjustments only where a product has an item in that profile; otherwise we fall back to the parent base.

### Adjustments

- `priceAdjustMode = FIXED`: adjustment is a **$ delta**
- `priceAdjustMode = DYNAMIC`: adjustment is a **% delta** of the base
- `incrementMode`: INCREASE vs DECREASE decides add/subtract

Negative new prices are blocked **server-side** (on both create and publish).

## “Demo user” behavior

This repo is intentionally auth-less for the challenge:

- Server actions and APIs use a deterministic user (defaults to `demo@foboh.local`).
- APIs additionally accept `x-user-email` to scope data to a caller-defined email (auto-upserts a user record).

## API (OpenAPI + Swagger UI)

- **Swagger UI**: `/api/docs`
- **OpenAPI JSON**: `/api/openapi.json`

The OpenAPI surface covers CRUD for:

- Products
- Pricing profiles
- Pricing profile items (add/update/remove products on a profile)

## Repo notes

### Prisma client output

Prisma Client is generated to `app/generated/prisma` (see `prisma/schema.prisma`), and `npm run build` runs `prisma generate` automatically before `next build`.
