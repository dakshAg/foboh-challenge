import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Workspace preferences (dummy data)."
      actions={<Badge variant="outline">Read-only demo</Badge>}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Basic configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium">Store name</div>
                <div className="text-muted-foreground text-[0.625rem]">Foboh Demo Store</div>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium">Timezone</div>
                <div className="text-muted-foreground text-[0.625rem]">America/Los_Angeles</div>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Access controls</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium">2FA</div>
                <div className="text-muted-foreground text-[0.625rem]">Enabled</div>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium">API keys</div>
                <div className="text-muted-foreground text-[0.625rem]">2 active keys</div>
              </div>
              <Button size="sm">Create</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Destructive actions (dummy)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs/relaxed">
            Reset the demo workspace to default state.
          </div>
          <Button variant="destructive" size="sm">
            Reset
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}


