## Foboh Challenge

A modern admin-style web application for managing product catalogs and pricing strategies. Features a clean, intuitive interface designed for business users.

### Key Features

- **Product Management**: Complete catalog with hierarchical taxonomy (Category → Subcategory → Segment)
- **Pricing**: All pricing profiles are based directly on global wholesale prices
  - Straightforward adjustments with real-time calculations
  - Manual refresh option for immediate updates
  - Support for both fixed dollar amounts and percentage adjustments
- **Workflow**: Draft → Preview → Publish for pricing profiles
- **API**: RESTful endpoints with OpenAPI/Swagger documentation

### Tech Stack

Built with **Next.js App Router**, **shadcn/ui**, **Prisma + Postgres**, **React Hook Form + Zod**, and a clean **OpenAPI/Swagger** surface for CRUD operations.

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

## Development Scripts

```bash
# Development
npm run dev            # Start Next.js development server with hot reload
npm run build          # Generate Prisma client and build for production
npm run start          # Start production server (requires build first)
npm run lint           # Run ESLint for code quality checks

# Database
npm run db:push        # Push Prisma schema changes to database
npm run prisma:generate # Generate Prisma client (runs automatically with build)

# Additional utilities
npm run type-check     # Run TypeScript type checking only
npm run clean          # Clean build artifacts and generated files
```

## App pages

Navigation is provided via the global `AppShell` (top bar + sidebar + mobile drawer).

### Core Features

- **Dashboard**: `/dashboard` - Overview and quick access to key functions
- **Products**: `/products` - Product catalog management
  - Add product: `/products/add-product` - Create new products with full details
  - Catalog setup: `/products/catalog-setup` - Configure taxonomy (Category → Subcategory → Segment)
- **Pricing**: `/pricing` - Pricing profile management
  - Profile list: `/pricing` - View all pricing profiles with status badges
  - Setup profile: `/pricing/setup-pricing-profile` - Create new pricing profiles
    - Multi-step form: Profile details → Product selection → Pricing configuration → Price adjustments
    - Real-time price preview with manual refresh option
  - Preview & publish: `/pricing/setup-pricing-profile/preview/[pricingProfileId]` - Review final pricing before publishing

### Placeholder Pages

- **Orders**: `/orders` - Order management (placeholder)
- **Customers**: `/customers` - Customer management (placeholder)
- **Freight**: `/freight` - Freight configuration (placeholder)
- **Integrations**: `/integrations` - Third-party integrations (placeholder)
- **Settings**: `/settings` - Application settings (placeholder)

All routes include loading UI via `loading.tsx` skeletons for better UX.

## Pricing model (how it works)

### Draft → Preview → Publish

- Creating a profile stores it as `status = DRAFT` and redirects to the preview page.
- Publishing marks it as `COMPLETED`.

### Pricing Logic

All pricing profiles are **based on global wholesale price** as the base. This provides a predictable pricing model where:

- Each product starts with its global wholesale price
- Adjustments are applied directly to this base price

### Adjustments

- `priceAdjustMode = FIXED`: adjustment is a **$ delta** (e.g., +$5.00 or -$2.50)
- `priceAdjustMode = DYNAMIC`: adjustment is a **% delta** of the base price (e.g., +10% or -5%)
- `incrementMode`: INCREASE vs DECREASE decides whether to add or subtract the adjustment

### Validation

- Negative new prices are blocked **server-side** (on both create and publish)
- All calculations happen in real-time with server-side validation
- Manual refresh button available for immediate price recalculation

## User Management

This application uses a simplified user scoping system (auth-less for demo purposes):

- **Default User**: All operations default to `demo@foboh.local`
- **API Scoping**: Include `x-user-email` header in API requests to scope data to different users
- **Auto-provisioning**: User records are automatically created when first accessed
- **Data Isolation**: Each user's data is completely isolated from others

This approach allows multiple users to test the application independently while keeping the codebase focused on core business logic rather than authentication complexity.

## UI/UX Design

### Client-Focused Interface

The application is designed specifically for business users, not developers:

- **Intuitive Icons**: Dollar signs ($) for fixed pricing, percent (%) for dynamic pricing
- **Progressive Disclosure**: Complex workflows broken into clear, manageable steps
- **Real-time Feedback**: Immediate price calculations with visual indicators

### Form Experience

- **Multi-step Process**: Pricing profile creation guides users through logical steps
- **Live Preview**: See price changes instantly as you adjust values
- **Validation**: Client-side and server-side validation with helpful error messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Data Visualization

- **Status Badges**: Clear visual indicators for pricing modes, increment types, and profile status
- **Interactive Tables**: Sortable, filterable product tables with inline editing
- **Progress Indicators**: Loading states and calculation feedback
- **Error Boundaries**: Graceful error handling with actionable messages

## API Reference

The application includes a REST API with full OpenAPI/Swagger documentation:

- **Swagger UI**: `/api/docs` - Interactive API documentation
- **OpenAPI JSON**: `/api/openapi.json` - Machine-readable API specification

### API Endpoints

**Products**
- `GET/POST /api/products` - List all products or create new product
- `GET/PUT/DELETE /api/products/[id]` - Get, update, or delete specific product

**Pricing Profiles**
- `GET/POST /api/pricing-profiles` - List all pricing profiles or create new profile
- `GET/PUT/DELETE /api/pricing-profiles/[id]` - Get, update, or delete specific profile
- `GET/POST /api/pricing-profiles/[id]/items` - Manage products within a pricing profile
- `PUT/DELETE /api/pricing-profiles/[id]/items/[itemId]` - Update or remove specific product from profile

**Taxonomy**
- Categories, subcategories, and segments are managed through the UI but follow standard REST patterns

### Authentication

The API uses a simple email-based user scoping system:
- Include `x-user-email` header to scope data to a specific user
- Defaults to `demo@foboh.local` for development/demo purposes
- Auto-creates user records as needed

## Architecture Notes

### Database & Prisma

- **Schema**: Uses Prisma with PostgreSQL for type-safe database operations
- **Client Generation**: Prisma Client is generated to `app/generated/prisma`
- **Build Integration**: `npm run build` automatically runs `prisma generate` before Next.js build
- **Migration Strategy**: Uses `prisma db push` for schema synchronization during development

### Server Actions

- All mutations use Next.js Server Actions for optimal performance and security
- Form validation happens on both client (React Hook Form + Zod) and server
- Real-time price calculations are performed server-side to ensure accuracy

### Pricing Design

The pricing system uses a direct adjustment model for maximum clarity:

- All profiles are based directly on global wholesale price
- Simple, predictable price calculations
- Support for both fixed dollar and percentage adjustments
- Real-time validation prevents negative prices
- No inheritance chains or complex profile references

### Development

- **Type Safety**: Full TypeScript coverage with strict type checking
- **Component Library**: shadcn/ui for consistent, accessible UI components
- **Form Handling**: React Hook Form with Zod schemas for robust form validation
- **Real-time Updates**: Optimistic UI updates with server-side validation

## Decisions & Tradeoffs
- While the spec mentions using React for front-end and Node.js for beck-end, modern NextJS supports them integrated with server actions, so I'll use that. We might have to connect this to external services, so we'll expose CRUD endpoints too.
- Database: While the spec doesn't require a DB implementation, with Postgres, its easier to build with a DB than without so a miniature DB is used for this. I'm running out of free projects on Supabase, so I used Prisma Postgres for this project. It's a bit slower and not as feature packed as Supabase but sufficient for demo.
- I've added a lot of pages so the demo feels complete, but all pages except Pricing will be filled with dummy data.
- I've added pages up in the dependency tree like Products and Categories catalog to make dev easier. They aren't high quality, but sufficient to build and test out pricing pages well.
- Task was pretty straightforward so didn't require thinking through a lot of it.