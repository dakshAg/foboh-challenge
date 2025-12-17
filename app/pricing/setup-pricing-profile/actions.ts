"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { pricingProfileSchema, type PricingProfileFormValues } from "./schema"
import { z } from "zod"

async function getDemoUser() {
  // In this challenge app we don’t have real auth, so we use a deterministic
  // “current user” for server actions and APIs. This keeps all data scoped
  // consistently without adding an auth stack.
  const demoEmail = "demo@foboh.local"
  return prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, password: "demo", name: "Demo User" },
  })
}


function applyAdjustment(args: {
  base: number
  adjustment: number
  priceAdjustMode: "FIXED" | "DYNAMIC"
  incrementMode: "INCREASE" | "DECREASE"
}) {
  // Core pricing formula:
  // - FIXED: delta = $adjustment
  // - DYNAMIC: delta = %adjustment of base
  // IncrementMode decides whether we add or subtract delta.
  const base = Number.isFinite(args.base) ? args.base : 0
  const adj = Number.isFinite(args.adjustment) ? args.adjustment : 0

  const delta = args.priceAdjustMode === "DYNAMIC" ? base * (adj / 100) : adj
  const newPrice = args.incrementMode === "DECREASE" ? base - delta : base + delta
  return { delta, newPrice }
}

export async function createPricingProfile(input: PricingProfileFormValues) {
  // Creates a DRAFT pricing profile and immediately redirects to the Preview
  // step. We validate that computed new prices cannot go negative server-side
  // (even if the client is bypassed).
  const parsed = pricingProfileSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const user = await getDemoUser()

  const { productIds, adjustments, ...profile } = parsed.data

  const products = await prisma.product.findMany({
    where: { userId: user.id, id: { in: productIds } },
    select: { id: true, title: true, globalWholesalePrice: true },
  })

  const negativeTitles: string[] = []
  for (const p of products) {
    // All pricing is now based directly on global wholesale price
    const base = Number(String(p.globalWholesalePrice ?? "0"))
    const safeBase = Number.isFinite(base) ? base : 0

    const rawAdj = Number(String(adjustments[p.id] ?? "0"))
    const safeAdj = Number.isFinite(rawAdj) ? rawAdj : 0

    const { newPrice } = applyAdjustment({
      base: safeBase,
      adjustment: safeAdj,
      priceAdjustMode: profile.priceAdjustMode,
      incrementMode: profile.incrementMode,
    })

    if (newPrice < 0) negativeTitles.push(p.title)
  }

  if (negativeTitles.length) {
    return {
      ok: false as const,
      message: `New price cannot be negative (${negativeTitles.length} product${negativeTitles.length === 1 ? "" : "s"}).`,
    }
  }

  const created = await prisma.pricingProfile.create({
    data: {
      ...profile,
      userId: user.id,
      status: "DRAFT",
      // Store per-product adjustments in ProductPricingProfile rows.
      productPricingProfiles: productIds.length
        ? {
            create: productIds.map((productId) => ({
              productId,
              adjustment: adjustments[productId] ?? "0",
            })),
          }
        : undefined,
    },
    select: { id: true },
  })

  // Revalidate listing and go to preview step.
  revalidatePath("/pricing")
  redirect(`/pricing/setup-pricing-profile/preview/${created.id}`)
}

const pricingPreviewSchema = z.object({
  basedOn: z.literal("globalWholesalePrice"),
  priceAdjustMode: z.enum(["FIXED", "DYNAMIC"]),
  incrementMode: z.enum(["INCREASE", "DECREASE"]),
  productIds: z.array(z.string().uuid()),
  adjustments: z.record(z.string(), z.string()),
})

export async function calculatePricingPreview(
  input: z.infer<typeof pricingPreviewSchema>
) {
  // Server-side pricing preview used by the client table. Keeping it on the
  // server guarantees we use the latest product prices and matches backend
  // business logic. All pricing profiles use global wholesale price as base.
  const parsed = pricingPreviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, message: "Invalid input." }
  }

  const user = await getDemoUser()

  const products = await prisma.product.findMany({
    where: { userId: user.id, id: { in: parsed.data.productIds } },
    select: { id: true, globalWholesalePrice: true },
  })

  const adjMode = parsed.data.priceAdjustMode
  const incMode = parsed.data.incrementMode

  const byId: Record<
    string,
    { base: number; delta: number; newPrice: number }
  > = {}

  for (const p of products) {
    // All pricing profiles use global wholesale price as the base price
    const base = Number(String(p.globalWholesalePrice ?? "0"))
    const safeBase = Number.isFinite(base) ? base : 0
    const rawAdj = Number(String(parsed.data.adjustments[p.id] ?? "0"))
    const safeAdj = Number.isFinite(rawAdj) ? rawAdj : 0

    const { delta, newPrice } = applyAdjustment({
      base: safeBase,
      adjustment: safeAdj,
      priceAdjustMode: adjMode,
      incrementMode: incMode,
    })

    byId[p.id] = {
      base,
      delta,
      newPrice,
    }
  }

  return { ok: true as const, byId }
}

const publishSchema = z.object({
  pricingProfileId: z.string().uuid(),
})

export async function publishPricingProfile(pricingProfileId: string) {
  return publishPricingProfileFormAction(pricingProfileId, new FormData())
}

// Form actions must accept FormData and return void/Promise<void>.
export async function publishPricingProfileFormAction(
  pricingProfileId: string,
  _formData: FormData
): Promise<void> {
  // Publishing is a state transition: DRAFT -> COMPLETED.
  // We re-check negatives here to prevent publishing invalid pricing even if
  // data changed between "create" and "publish" steps.
  const parsed = publishSchema.safeParse({ pricingProfileId })
  if (!parsed.success) {
    redirect(`/pricing/setup-pricing-profile/preview/${pricingProfileId}?error=invalid`)
  }

  const user = await getDemoUser()

  const profile = await prisma.pricingProfile.findFirst({
    where: { id: parsed.data.pricingProfileId, userId: user.id },
    include: {
      productPricingProfiles: {
        include: { product: { select: { id: true, title: true, globalWholesalePrice: true } } },
      },
    },
  })

  if (!profile) {
    redirect(`/pricing/setup-pricing-profile/preview/${pricingProfileId}?error=not_found`)
  }

  // Re-check negatives using stored adjustments.
  // All pricing is now based directly on global wholesale price.
  const negativeTitles: string[] = []
  for (const ppp of profile.productPricingProfiles) {
    const base = Number(String(ppp.product.globalWholesalePrice ?? "0"))
    const safeBase = Number.isFinite(base) ? base : 0
    const rawAdj = Number(String(ppp.adjustment ?? "0"))
    const safeAdj = Number.isFinite(rawAdj) ? rawAdj : 0

    const { newPrice } = applyAdjustment({
      base: safeBase,
      adjustment: safeAdj,
      priceAdjustMode: profile.priceAdjustMode,
      incrementMode: profile.incrementMode,
    })
    if (newPrice < 0) negativeTitles.push(ppp.product.title)
  }

  if (negativeTitles.length) {
    redirect(`/pricing/setup-pricing-profile/preview/${profile.id}?error=negative`)
  }

  await prisma.pricingProfile.updateMany({
    where: { id: profile.id, userId: user.id },
    data: { status: "COMPLETED" },
  })

  revalidatePath("/pricing")
  redirect("/pricing")
}


