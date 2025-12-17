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

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, sku: true, brand: true },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <PageShell
      title="Set up pricing profile"
      description="Create a pricing profile."
    >
      <PricingProfileForm products={products} />
    </PageShell>
  )
}


