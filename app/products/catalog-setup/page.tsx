import { PageShell } from "@/components/page-shell"
import prisma from "@/lib/prisma"
import { CatalogSetupForms } from "./catalog-setup-forms"

export const dynamic = "force-dynamic"

export default async function CatalogSetupPage() {
  const demoEmail = "demo@foboh.local"

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, password: "demo", name: "Demo User" },
  })

  const [categories, subcategories, segments] = await Promise.all([
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

  return (
    <PageShell
      title="Catalog setup"
      description="Create categories, subcategories, and segments."
    >
      <CatalogSetupForms
        categories={categories}
        subcategories={subcategories}
        segments={segments}
      />
    </PageShell>
  )
}


