/**
 * Pricing profile preview page.
 *
 * This page displays a complete preview of a pricing profile before publishing.
 * It shows calculated prices for all products in the profile and allows
 * publishing the profile to make it active.
 *
 * Key features:
 * - Server-side price calculation with profile chain resolution
 * - Visual preview of all pricing adjustments
 * - Validation (prevents negative prices)
 * - Publishing workflow with error handling
 * - Responsive table layout for product data
 */

import Link from "next/link"

import prisma from "@/lib/prisma"
import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { publishPricingProfileFormAction } from "../../actions"

export const dynamic = "force-dynamic"

/**
 * Formats a number as USD currency for display.
 */
function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n)
}

/**
 * Preview page for pricing profiles.
 *
 * This server component:
 * 1. Fetches the pricing profile and its associated products
 * 2. Calculates final prices based directly on global wholesale price
 * 3. Displays preview with validation and publishing options
 *
 * All pricing profiles now use global wholesale price as the base.
 *
 * @param params - Route parameters containing pricingProfileId
 * @param searchParams - Query parameters, may contain error messages
 */
export default async function PricingProfilePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ pricingProfileId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { pricingProfileId } = await params
  const { error } = await searchParams

  const demoEmail = "demo@foboh.local"
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, password: "demo", name: "Demo User" },
  })

  const profile = await prisma.pricingProfile.findFirst({
    where: { id: pricingProfileId, userId: user.id },
    include: {
      productPricingProfiles: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sku: true,
              brand: true,
              globalWholesalePrice: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  if (!profile) {
    return (
      <PageShell title="Preview" description="Pricing profile not found.">
        <Button asChild variant="outline" size="sm">
          <Link href="/pricing">Back to pricing</Link>
        </Button>
      </PageShell>
    )
  }

  /**
   * Applies a pricing adjustment to a base price.
   *
   * @param base - The base price to adjust
   * @param adjustment - The adjustment value (fixed amount or percentage)
   * @param mode - FIXED (dollar amount) or DYNAMIC (percentage)
   * @param inc - INCREASE (add adjustment) or DECREASE (subtract adjustment)
   * @returns The adjusted price
   */
  function applyAdjustment(base: number, adjustment: number, mode: "FIXED" | "DYNAMIC", inc: "INCREASE" | "DECREASE") {
    const delta = mode === "DYNAMIC" ? base * (adjustment / 100) : adjustment
    return inc === "DECREASE" ? base - delta : base + delta
  }

  // Calculate final prices for all products in this profile
  // All pricing is now based directly on global wholesale price
  const rows = profile.productPricingProfiles.map((ppp) => {
    // Parse and validate product data
    const global = Number(String(ppp.product.globalWholesalePrice ?? "0"))
    const safeGlobal = Number.isFinite(global) ? global : 0

    // All pricing profiles now use global wholesale price as the base
    const base = safeGlobal

    // Parse the adjustment value for this specific product
    const adj = Number(String(ppp.adjustment ?? "0"))
    const safeAdj = Number.isFinite(adj) ? adj : 0

    // Calculate the final price adjustment and new price
    const delta =
      profile.priceAdjustMode === "DYNAMIC" ? base * (safeAdj / 100) : safeAdj
    const newPrice =
      profile.incrementMode === "DECREASE" ? base - delta : base + delta

    return {
      id: ppp.id,
      title: ppp.product.title,
      sku: ppp.product.sku,
      brand: ppp.product.brand,
      category: ppp.product.category.name,
      base,
      adjustment: safeAdj,
      newPrice,
    }
  })

  // Validate that no products have negative prices (business rule)
  const hasNegative = rows.some((r) => r.newPrice < 0)

  return (
    <PageShell
      title="Preview pricing profile"
      description="Review your pricing changes, then publish."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/pricing">Back</Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{profile.status}</Badge>
        <Badge variant="secondary">{profile.priceAdjustMode === "DYNAMIC" ? "Percent" : "Dollars"}</Badge>
        <Badge variant={profile.incrementMode === "DECREASE" ? "destructive" : "secondary"}>
          {profile.incrementMode}
        </Badge>
        <Badge variant="outline">Based on: Global wholesale price</Badge>
        <Badge variant="outline">{rows.length} items</Badge>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
          <CardDescription>{profile.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40">
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Based on price</th>
                  <th className="px-3 py-2 font-medium">Adjustment</th>
                  <th className="px-3 py-2 font-medium">New price</th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-muted-foreground mt-0.5 text-[0.625rem]">{r.brand}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[0.625rem]">{r.sku}</td>
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2">{formatMoney(r.base)}</td>
                    <td className="px-3 py-2">
                      {profile.priceAdjustMode === "DYNAMIC"
                        ? `${r.adjustment}%`
                        : formatMoney(r.adjustment)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <span className={r.newPrice < 0 ? "text-destructive" : ""}>
                        {formatMoney(r.newPrice)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasNegative ? (
            <div className="text-destructive mt-3 text-xs/relaxed">
              Some items have a negative new price. Go back and adjust before publishing.
            </div>
          ) : null}

          {/* Display publishing errors from server actions */}
          {/* Display publishing errors from server actions */}
          {error ? (
            <div className="text-destructive mt-3 text-xs/relaxed">
              {error === "negative"
                ? "Cannot publish: new price would be negative."
                : error === "invalid"
                  ? "Cannot publish: invalid profile id."
                  : error === "not_found"
                    ? "Cannot publish: profile not found."
                    : "Cannot publish due to an error."}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Sticky footer with publish action */}
      {/* Only allows publishing if no negative prices and profile is in DRAFT status */}
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-4 mt-4 border-t px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <form action={publishPricingProfileFormAction.bind(null, profile.id)} className="flex justify-end">
          <Button type="submit" disabled={hasNegative || profile.status !== "DRAFT"}>
            Publish
          </Button>
        </form>
      </div>
    </PageShell>
  )
}


