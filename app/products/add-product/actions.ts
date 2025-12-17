"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { productSchema, type ProductFormValues } from "./schema"

export async function createProduct(input: ProductFormValues) {
  // Server action for the Add Product form.
  // Validates input, scopes to the current user, and redirects on success.
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  // Deterministic “current user” for this challenge (no auth layer).
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

  try {
    // Note: globalWholesalePrice is a Decimal in Prisma; we store it as a numeric string.
    await prisma.product.create({
      data: {
        ...parsed.data,
        userId: user.id,
        globalWholesalePrice: parsed.data.globalWholesalePrice,
      },
    })
  } catch (e) {
    // SKU is unique; conflicts will land here.
    return {
      ok: false as const,
      message:
        "Could not create product. If the SKU already exists, try a different SKU.",
    }
  }

  // Revalidate the listing page and return the user to it.
  revalidatePath("/products")
  redirect("/products")
}


