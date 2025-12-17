/**
 * Pricing profile setup page.
 *
 * This page provides a comprehensive form for creating new pricing profiles.
 * It handles the complex workflow of:
 * - Selecting products to include in the profile
 * - Configuring pricing adjustment modes and rules
 * - Setting base pricing references
 * - Previewing calculated prices before saving
 *
 * The page fetches all necessary data server-side for optimal performance
 * and provides a rich client-side form experience.
 */

import { PageShell } from "@/components/page-shell"
import { PricingProfileForm } from "./pricing-profile-form"
import prisma from "@/lib/prisma"

/**
 * Setup page for creating new pricing profiles.
 *
 * This server component:
 * 1. Ensures a demo user exists (for development/demo purposes)
 * 2. Fetches all products, categories, and existing profiles for the user
 * 3. Passes data to the client-side PricingProfileForm component
 * 4. Handles data serialization (converts Prisma Decimal to string)
 */
export default async function SetupPricingProfilePage() {
  // Demo user setup for development - in production this would use real auth
  const demoEmail = "demo@foboh.local"
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      password: "demo",
      name: "Demo User",
    },
  })

  // Fetch all data needed for the pricing profile form
  // Parallel queries for better performance
  const [rawProducts, categories, subcategories, segments, pricingProfiles] = await Promise.all([
    prisma.product.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        sku: true,
        brand: true,
        globalWholesalePrice: true,
        categoryId: true,
        subcategoryId: true,
        segmentId: true,
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        segment: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.subcategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, categoryId: true },
    }),
    prisma.segment.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, subcategoryId: true },
    }),
    prisma.pricingProfile.findMany({
      where: { userId: user.id, status: { in: ["DRAFT", "COMPLETED"] } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, status: true, basedOn: true },
    }),
  ])

  // Prisma Decimal isn't serializable to Client Components; convert to string.
  const products = rawProducts.map((p) => ({
    ...p,
    globalWholesalePrice: String(p.globalWholesalePrice),
  }))

  return (
    <PageShell
      title="Set up pricing profile"
      description="Create a pricing profile."
    >
      <PricingProfileForm
        products={products}
        categories={categories}
        subcategories={subcategories}
        segments={segments}
        pricingProfiles={pricingProfiles}
      />
    </PageShell>
  )
}


