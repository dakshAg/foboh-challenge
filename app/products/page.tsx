import Link from "next/link"

import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

export const dynamic = "force-dynamic"

function formatMoney(value: unknown) {
  // Prisma Decimal stringifies nicely in server components.
  const num = Number(String(value))
  if (Number.isFinite(num)) return `$${num.toFixed(2)}`
  return String(value)
}

export default async function ProductsPage() {
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
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      sku: true,
      brand: true,
      globalWholesalePrice: true,
      updatedAt: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
      segment: { select: { name: true } },
    },
  })

  return (
    <PageShell
      title="Products"
      description="Catalog & inventory."
      actions={
        <>
          <Button asChild size="sm">
            <Link href="/products/add-product">Add product</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/products/catalog-setup">Catalog setup</Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Catalog size</CardDescription>
            <CardTitle>{products.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            Total products for {user.name}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unique brands</CardDescription>
            <CardTitle>{new Set(products.map((p) => p.brand)).size}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            Counted from current list
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest update</CardDescription>
            <CardTitle>
              {products[0]?.updatedAt
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  }).format(products[0].updatedAt)
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            Most recently modified product
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>All products for this user</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-muted-foreground text-xs/relaxed">
              No products yet. Click <span className="font-medium">Add product</span> to create one.
            </div>
          ) : (
            <ul className="divide-border/50 divide-y">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium">{p.title}</div>
                    <div className="text-muted-foreground mt-1 text-[0.625rem]">
                      {p.brand} • {p.sku}
                    </div>
                  <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                    {p.category.name} / {p.subcategory.name} / {p.segment.name}
                  </div>
                  </div>
                  <div className="text-xs font-medium">
                    {formatMoney(p.globalWholesalePrice)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}


