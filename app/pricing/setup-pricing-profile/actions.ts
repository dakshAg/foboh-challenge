"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { pricingProfileSchema, type PricingProfileFormValues } from "./schema"

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

  const { productIds, ...profile } = parsed.data

  await prisma.pricingProfile.create({
    data: {
      ...profile,
      userId: user.id,
      productPricingProfiles: productIds.length
        ? {
            create: productIds.map((productId) => ({
              productId,
              adjustment: "0",
            })),
          }
        : undefined,
    },
  })

  revalidatePath("/pricing")
  redirect("/pricing")
}


