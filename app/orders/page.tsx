import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

const orders = [
  { id: "ORD-1042", customer: "Acme Retail", total: 129.99, status: "Paid", channel: "Online" },
  { id: "ORD-1041", customer: "Nova Supplies", total: 89.5, status: "Pending", channel: "Online" },
  { id: "ORD-1040", customer: "Zenith Co.", total: 512.0, status: "Fulfilled", channel: "Wholesale" },
  { id: "ORD-1039", customer: "Maple & Co.", total: 42.25, status: "Refunded", channel: "Online" },
  { id: "ORD-1038", customer: "Bridge Mart", total: 219.0, status: "Paid", channel: "POS" },
] as const

function statusBadge(status: (typeof orders)[number]["status"]) {
  switch (status) {
    case "Paid":
    case "Fulfilled":
      return <Badge variant="secondary">{status}</Badge>
    case "Pending":
      return <Badge variant="outline">{status}</Badge>
    case "Refunded":
      return <Badge variant="destructive">{status}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function OrdersPage() {
  return (
    <PageShell
      title="Orders"
      description="Recent orders (dummy data)."
      actions={
        <>
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button size="sm">Create Order</Button>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Latest</CardTitle>
          <CardDescription>Most recent 5 orders</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-border/50 divide-y">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium">{o.id}</div>
                    {statusBadge(o.status)}
                  </div>
                  <div className="text-muted-foreground mt-1 text-[0.625rem]">
                    {o.customer} • {o.channel}
                  </div>
                </div>
                <div className="text-xs font-medium">${o.total.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  )
}


