import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

const integrations = [
  { id: "int_stripe", name: "Stripe", category: "Payments", status: "Connected" },
  { id: "int_shopify", name: "Shopify", category: "Storefront", status: "Not connected" },
  { id: "int_slack", name: "Slack", category: "Messaging", status: "Connected" },
  { id: "int_shippo", name: "Shippo", category: "Shipping", status: "Not connected" },
] as const

function integrationBadge(status: (typeof integrations)[number]["status"]) {
  return status === "Connected" ? (
    <Badge variant="secondary">Connected</Badge>
  ) : (
    <Badge variant="outline">Not connected</Badge>
  )
}

export default function IntegrationsPage() {
  return (
    <PageShell
      title="Integrations"
      description="Connect external services (dummy data)."
      actions={<Button size="sm">Browse directory</Button>}
    >
      <section className="grid gap-4 md:grid-cols-2">
        {integrations.map((i) => (
          <Card key={i.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{i.name}</CardTitle>
                {integrationBadge(i.status)}
              </div>
              <CardDescription>{i.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs/relaxed">
                Webhook events, sync & health checks (dummy)
              </div>
              <Button variant={i.status === "Connected" ? "outline" : "default"} size="sm">
                {i.status === "Connected" ? "Manage" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </PageShell>
  )
}


