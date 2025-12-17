import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

const products = [
  { sku: "PRD-FOAM-01", name: "Foam Roller", price: 24.99, inventory: 12, status: "Low stock" },
  { sku: "PRD-MAT-02", name: "Yoga Mat", price: 39.99, inventory: 180, status: "In stock" },
  { sku: "PRD-BAND-03", name: "Resistance Bands", price: 19.5, inventory: 64, status: "In stock" },
  { sku: "PRD-BOTTLE-04", name: "Water Bottle", price: 14.0, inventory: 0, status: "Out of stock" },
  { sku: "PRD-KB-05", name: "Kettlebell 16kg", price: 79.0, inventory: 8, status: "Low stock" },
] as const

function stockBadge(status: (typeof products)[number]["status"]) {
  switch (status) {
    case "In stock":
      return <Badge variant="secondary">In stock</Badge>
    case "Low stock":
      return <Badge variant="outline">Low stock</Badge>
    case "Out of stock":
      return <Badge variant="destructive">Out of stock</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function ProductsPage() {
  return (
    <PageShell
      title="Products"
      description="Catalog & inventory (dummy data)."
      actions={
        <>
          <Button variant="outline" size="sm">
            Bulk edit
          </Button>
          <Button size="sm">Add Product</Button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Catalog size</CardDescription>
            <CardTitle>{products.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">Dummy SKUs</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low stock</CardDescription>
            <CardTitle>{products.filter((p) => p.status === "Low stock").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">Below threshold</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Out of stock</CardDescription>
            <CardTitle>{products.filter((p) => p.status === "Out of stock").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">Needs reorder</CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Current on-hand quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-border/50 divide-y">
            {products.map((p) => (
              <li key={p.sku} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium">{p.name}</div>
                    {stockBadge(p.status)}
                  </div>
                  <div className="text-muted-foreground mt-1 text-[0.625rem]">{p.sku}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground text-xs">${p.price.toFixed(2)}</div>
                  <div className="text-xs font-medium">{p.inventory} on hand</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  )
}


