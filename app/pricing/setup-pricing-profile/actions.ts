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

  await prisma.pricingProfile.create({
    data: {
      ...profile,
      userId: user.id,
      productPricingProfiles: productIds.length
        ? {
            create: productIds.map((productId) => ({
              productId,
              adjustment: adjustments[productId] ?? "0",
            })),
          }
        : undefined,
    },
  })

  revalidatePath("/pricing")
  redirect("/pricing")
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


