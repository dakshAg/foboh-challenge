/**
 * Main pricing page that displays all pricing profiles.
 *
 * This page serves as the entry point for pricing management, showing:
 * - List of existing pricing profiles with their details
 * - Quick access to create new profiles
 * - Links to view individual profile previews
 *
 * Features:
 * - Server-side rendered for SEO and performance
 * - Real-time data from database
 * - Responsive card layout for profile display
 */

import Link from "next/link"

import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/page-shell"

export const dynamic = "force-dynamic"

/**
 * Formats a date for display in the UI.
 * Shows date in format like "Jan 15, 2024"
 */
function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date)
}

/**
 * Main pricing profiles listing page.
 *
 * Fetches and displays all pricing profiles for the current user,
 * ordered by most recently updated first.
 */
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
      {/* Display pricing profiles in a responsive grid */}
      <section className="grid gap-4 md:grid-cols-2">
        {pricingProfiles.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                {/* Show pricing mode and adjustment type */}
                <div className="text-muted-foreground text-[0.625rem]">
                  {p.priceAdjustMode} • {p.incrementMode}
                </div>
              </div>
              <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            {/* Display base reference and last updated timestamp */}
            <CardContent className="text-muted-foreground text-xs/relaxed">
              Based on: Global wholesale price • Updated: {formatUpdatedAt(p.updatedAt)}
            </CardContent>
            <CardFooter className="gap-2">
              {/* Link to detailed preview of the pricing profile */}
              <Button asChild variant="outline" size="sm">
                <Link href={`/pricing/setup-pricing-profile/preview/${p.id}`}>View</Link>
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


