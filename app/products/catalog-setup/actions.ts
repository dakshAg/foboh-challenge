"use server"

import { revalidatePath } from "next/cache"

import prisma from "@/lib/prisma"
import {
  categorySchema,
  segmentSchema,
  subcategorySchema,
  type CategoryFormValues,
  type SegmentFormValues,
  type SubcategoryFormValues,
} from "./schema"

async function getDemoUser() {
  const demoEmail = "demo@foboh.local"
  return prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, password: "demo", name: "Demo User" },
  })
}

export async function createCategory(input: CategoryFormValues) {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const user = await getDemoUser()
  await prisma.category.create({
    data: { userId: user.id, name: parsed.data.name },
  })
  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function createSubcategory(input: SubcategoryFormValues) {
  const parsed = subcategorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const user = await getDemoUser()
  await prisma.subcategory.create({
    data: { userId: user.id, categoryId: parsed.data.categoryId, name: parsed.data.name },
  })
  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function createSegment(input: SegmentFormValues) {
  const parsed = segmentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const user = await getDemoUser()
  await prisma.segment.create({
    data: { userId: user.id, subcategoryId: parsed.data.subcategoryId, name: parsed.data.name },
  })
  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}


