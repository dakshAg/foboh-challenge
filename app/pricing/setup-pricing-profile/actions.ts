"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { pricingProfileSchema, type PricingProfileFormValues } from "./schema"
import { z } from "zod"

export async function createPricingProfile(input: PricingProfileFormValues) {
  const parsed = pricingProfileSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const demoEmail = "demo@foboh.local"

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      password: "demo",
      name: "Demo User",
    },
  })

  const { productIds, adjustments, ...profile } = parsed.data

  // Server-side safety: prevent negative new prices.
  if (profile.basedOn !== "globalWholesalePrice") {
    return {
      ok: false as const,
      message: "Unsupported basedOn field.",
    }
  }

  const products = await prisma.product.findMany({
    where: { userId: user.id, id: { in: productIds } },
    select: { id: true, title: true, globalWholesalePrice: true },
  })

  const negativeTitles: string[] = []
  for (const p of products) {
    const base = Number(String(p.globalWholesalePrice ?? "0"))
    const rawAdj = Number(String(adjustments[p.id] ?? "0"))
    const safeBase = Number.isFinite(base) ? base : 0
    const safeAdj = Number.isFinite(rawAdj) ? rawAdj : 0
    const delta =
      profile.priceAdjustMode === "DYNAMIC" ? safeBase * (safeAdj / 100) : safeAdj
    const newPrice =
      profile.incrementMode === "DECREASE" ? safeBase - delta : safeBase + delta
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

  revalidatePath("/pricing")
  redirect(`/pricing/setup-pricing-profile/preview/${created.id}`)
}

const pricingPreviewSchema = z.object({
  basedOn: z.string(),
  priceAdjustMode: z.enum(["FIXED", "DYNAMIC"]),
  incrementMode: z.enum(["INCREASE", "DECREASE"]),
  productIds: z.array(z.string().uuid()),
  adjustments: z.record(z.string(), z.string()),
})

export async function calculatePricingPreview(
  input: z.infer<typeof pricingPreviewSchema>
) {
  const parsed = pricingPreviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, message: "Invalid input." }
  }

  if (parsed.data.basedOn !== "globalWholesalePrice") {
    return { ok: false as const, message: "Unsupported basedOn field." }
  }

  const demoEmail = "demo@foboh.local"

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      password: "demo",
      name: "Demo User",
    },
  })

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
    const base = Number(String(p.globalWholesalePrice ?? "0"))
    const rawAdj = Number(String(parsed.data.adjustments[p.id] ?? "0"))
    const safeBase = Number.isFinite(base) ? base : 0
    const safeAdj = Number.isFinite(rawAdj) ? rawAdj : 0

    const delta = adjMode === "DYNAMIC" ? safeBase * (safeAdj / 100) : safeAdj
    const newPrice = incMode === "DECREASE" ? safeBase - delta : safeBase + delta

    byId[p.id] = {
      base: safeBase,
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
  const parsed = publishSchema.safeParse({ pricingProfileId })
  if (!parsed.success) {
    redirect(`/pricing/setup-pricing-profile/preview/${pricingProfileId}?error=invalid`)
  }

  const demoEmail = "demo@foboh.local"

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      password: "demo",
      name: "Demo User",
    },
  })

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

  if (profile.basedOn !== "globalWholesalePrice") {
    redirect(`/pricing/setup-pricing-profile/preview/${profile.id}?error=unsupported`)
  }

  // Re-check negatives using stored adjustments.
  const negativeTitles: string[] = []
  for (const ppp of profile.productPricingProfiles) {
    const base = Number(String(ppp.product.globalWholesalePrice ?? "0"))
    const rawAdj = Number(String(ppp.adjustment ?? "0"))
    const safeBase = Number.isFinite(base) ? base : 0
    const safeAdj = Number.isFinite(rawAdj) ? rawAdj : 0
    const delta =
      profile.priceAdjustMode === "DYNAMIC" ? safeBase * (safeAdj / 100) : safeAdj
    const newPrice =
      profile.incrementMode === "DECREASE" ? safeBase - delta : safeBase + delta
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


