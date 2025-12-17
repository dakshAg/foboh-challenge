import { PageShell } from "@/components/page-shell"
import { PricingProfileForm } from "./pricing-profile-form"
import prisma from "@/lib/prisma"

export default async function SetupPricingProfilePage() {
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

  const [rawProducts, categories, subcategories, segments] = await Promise.all([
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
      />
    </PageShell>
  )
}


