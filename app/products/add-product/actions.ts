"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import prisma from "@/lib/prisma"
import { productSchema, type ProductFormValues } from "./schema"

export async function createProduct(input: ProductFormValues) {
  const parsed = productSchema.safeParse(input)
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

  try {
    await prisma.product.create({
      data: {
        ...parsed.data,
        userId: user.id,
        globalWholesalePrice: parsed.data.globalWholesalePrice,
      },
    })
  } catch (e) {
    return {
      ok: false as const,
      message:
        "Could not create product. If the SKU already exists, try a different SKU.",
    }
  }

  revalidatePath("/products")
  redirect("/products")
}


