import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

const recentActivity = [
  { id: "evt_1029", label: "Order #1042 marked as Paid", time: "2m ago" },
  { id: "evt_1028", label: "Customer ‘Acme Retail’ created", time: "18m ago" },
  { id: "evt_1027", label: "Inventory low: ‘Foam Roller’", time: "1h ago" },
  { id: "evt_1026", label: "Integration ‘Stripe’ connected", time: "3h ago" },
]

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Overview of your store’s performance (dummy data)."
      actions={<Badge variant="secondary">Demo</Badge>}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle>$48,920</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            +12.4% vs last week
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders</CardDescription>
            <CardTitle>1,284</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            92 pending fulfillment
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Customers</CardDescription>
            <CardTitle>642</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            38 new this month
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Churn risk</CardDescription>
            <CardTitle>3.1%</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs/relaxed">
            Based on 30-day inactivity
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest events across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-border/50 divide-y">
              {recentActivity.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-2">
                  <div className="text-xs/relaxed">{row.label}</div>
                  <div className="text-muted-foreground text-[0.625rem]">{row.time}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health</CardTitle>
            <CardDescription>Dummy checks for common issues</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="text-xs/relaxed">Payments</div>
              <Badge variant="secondary">OK</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs/relaxed">Fulfillment</div>
              <Badge variant="outline">Degraded</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs/relaxed">Webhooks</div>
              <Badge variant="secondary">OK</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}


