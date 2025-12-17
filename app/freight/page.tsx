import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

const shipments = [
  { id: "SHP-2201", carrier: "UPS", lane: "SFO → NYC", eta: "2 days", status: "In transit" },
  { id: "SHP-2200", carrier: "FedEx", lane: "LAX → SEA", eta: "Tomorrow", status: "Label created" },
  { id: "SHP-2199", carrier: "DHL", lane: "AUS → CHI", eta: "3 days", status: "Delayed" },
  { id: "SHP-2198", carrier: "UPS", lane: "SJC → BOS", eta: "Delivered", status: "Delivered" },
] as const

function freightBadge(status: (typeof shipments)[number]["status"]) {
  switch (status) {
    case "Delivered":
      return <Badge variant="secondary">Delivered</Badge>
    case "In transit":
    case "Label created":
      return <Badge variant="outline">{status}</Badge>
    case "Delayed":
      return <Badge variant="destructive">Delayed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function FreightPage() {
  return (
    <PageShell
      title="Freight"
      description="Shipments & carriers (dummy data)."
      actions={
        <>
          <Button variant="outline" size="sm">
            Rates
          </Button>
          <Button size="sm">Create shipment</Button>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Shipments</CardTitle>
          <CardDescription>Latest outbound loads</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-border/50 divide-y">
            {shipments.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium">{s.id}</div>
                    {freightBadge(s.status)}
                  </div>
                  <div className="text-muted-foreground mt-1 text-[0.625rem]">
                    {s.carrier} • {s.lane}
                  </div>
                </div>
                <div className="text-xs font-medium">{s.eta}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  )
}


