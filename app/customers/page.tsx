import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

const customers = [
  { id: "CUS-001", name: "Acme Retail", segment: "B2B", orders: 24, ltv: 8420, status: "Active" },
  { id: "CUS-002", name: "Nova Supplies", segment: "B2B", orders: 8, ltv: 2120, status: "Active" },
  { id: "CUS-003", name: "Maple & Co.", segment: "DTC", orders: 3, ltv: 190, status: "At risk" },
  { id: "CUS-004", name: "Zenith Co.", segment: "B2B", orders: 12, ltv: 5160, status: "Active" },
  { id: "CUS-005", name: "Bridge Mart", segment: "Retail", orders: 5, ltv: 980, status: "Inactive" },
] as const

function statusBadge(status: (typeof customers)[number]["status"]) {
  switch (status) {
    case "Active":
      return <Badge variant="secondary">Active</Badge>
    case "At risk":
      return <Badge variant="outline">At risk</Badge>
    case "Inactive":
      return <Badge variant="destructive">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function CustomersPage() {
  return (
    <PageShell
      title="Customers"
      description="Customer directory (dummy data)."
      actions={
        <>
          <Button variant="outline" size="sm">
            Import
          </Button>
          <Button size="sm">Add Customer</Button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total customers</CardDescription>
            <CardTitle>{customers.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">Dummy count</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle>{customers.filter((c) => c.status === "Active").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">Dummy segment</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At risk</CardDescription>
            <CardTitle>{customers.filter((c) => c.status === "At risk").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">Dummy heuristic</CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Top customers by LTV</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-border/50 divide-y">
            {customers
              .slice()
              .sort((a, b) => b.ltv - a.ltv)
              .map((c) => (
                <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium">{c.name}</div>
                      {statusBadge(c.status)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-[0.625rem]">
                      {c.id} • {c.segment} • {c.orders} orders
                    </div>
                  </div>
                  <div className="text-xs font-medium">${c.ltv.toLocaleString()}</div>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  )
}


