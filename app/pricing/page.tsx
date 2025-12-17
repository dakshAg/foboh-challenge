import Link from "next/link"

import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

export const dynamic = "force-dynamic"

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date)
}

export default async function PricingPage() {
  const pricingProfiles = await prisma.pricingProfile.findMany({
    orderBy: { updatedAt: "desc" },
  })

  return (
    <PageShell
      title="Pricing"
      description="Pricing profiles control how customers are charged."
      actions={
        <Button asChild size="sm">
          <Link href="/pricing/setup-pricing-profile">Set up profile</Link>
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-2">
        {pricingProfiles.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                <div className="text-muted-foreground text-[0.625rem]">
                  {p.priceAdjustMode} • {p.incrementMode}
                </div>
              </div>
              <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs/relaxed">
              Based on: {p.basedOn} • Updated: {formatUpdatedAt(p.updatedAt)}
            </CardContent>
            <CardFooter className="gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/pricing/setup-pricing-profile/preview/${p.id}`}>View</Link>
              </Button>
              <Button variant="ghost" size="sm">
                Duplicate
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      {pricingProfiles.length === 0 ? (
        <div className="text-muted-foreground mt-6 text-xs/relaxed">
          No pricing profiles yet. Click <span className="font-medium">Set up profile</span> to create one.
        </div>
      ) : null}
    </PageShell>
  )
}


