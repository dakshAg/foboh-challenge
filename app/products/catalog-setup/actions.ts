"use server"

import { revalidatePath } from "next/cache"

import prisma from "@/lib/prisma"
import {
  categorySchema,
  deleteSchema,
  renameSchema,
  segmentSchema,
  subcategorySchema,
  type CategoryFormValues,
  type DeleteValues,
  type RenameValues,
  type SegmentFormValues,
  type SubcategoryFormValues,
} from "./schema"

async function getDemoUser() {
  // Deterministic “current user” for this challenge (no auth layer).
  const demoEmail = "demo@foboh.local"
  return prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, password: "demo", name: "Demo User" },
  })
}

export async function createCategory(input: CategoryFormValues) {
  // Creates a category scoped to the current user.
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
  // Creates a subcategory under a category. Validates categoryId belongs to the user via DB constraints.
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
  // Creates a segment under a subcategory.
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

export async function renameCategory(input: RenameValues) {
  // Renames a category; uses updateMany + userId guard to avoid leaking existence across users.
  const parsed = renameSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()
  try {
    const res = await prisma.category.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { name: parsed.data.name },
    })
    if (res.count === 0) return { ok: false as const, message: "Category not found." }
  } catch {
    return { ok: false as const, message: "Could not rename category (maybe duplicate name)." }
  }
  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function renameSubcategory(input: RenameValues) {
  // Renames a subcategory (scoped by userId).
  const parsed = renameSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()
  try {
    const res = await prisma.subcategory.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { name: parsed.data.name },
    })
    if (res.count === 0) return { ok: false as const, message: "Subcategory not found." }
  } catch {
    return { ok: false as const, message: "Could not rename subcategory (maybe duplicate name)." }
  }
  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function renameSegment(input: RenameValues) {
  // Renames a segment (scoped by userId).
  const parsed = renameSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()
  try {
    const res = await prisma.segment.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { name: parsed.data.name },
    })
    if (res.count === 0) return { ok: false as const, message: "Segment not found." }
  } catch {
    return { ok: false as const, message: "Could not rename segment (maybe duplicate name)." }
  }
  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function deleteCategory(input: DeleteValues) {
  // Deletes category and its descendants, but only if no Product references it.
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()

  const productCount = await prisma.product.count({
    where: { userId: user.id, categoryId: parsed.data.id },
  })
  if (productCount > 0) {
    return { ok: false as const, message: "Cannot delete: category has products." }
  }

  // Cascade delete subcategories + segments in a transaction.
  await prisma.$transaction(async (tx) => {
    const subcats = await tx.subcategory.findMany({
      where: { userId: user.id, categoryId: parsed.data.id },
      select: { id: true },
    })
    const subcatIds = subcats.map((s) => s.id)

    if (subcatIds.length) {
      await tx.segment.deleteMany({
        where: { userId: user.id, subcategoryId: { in: subcatIds } },
      })
      await tx.subcategory.deleteMany({
        where: { userId: user.id, id: { in: subcatIds } },
      })
    }

    await tx.category.deleteMany({
      where: { userId: user.id, id: parsed.data.id },
    })
  })

  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function deleteSubcategory(input: DeleteValues) {
  // Deletes subcategory and its segments, but only if no Product references it.
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()

  const productCount = await prisma.product.count({
    where: { userId: user.id, subcategoryId: parsed.data.id },
  })
  if (productCount > 0) {
    return { ok: false as const, message: "Cannot delete: subcategory has products." }
  }

  // Cascade delete segments in a transaction.
  await prisma.$transaction(async (tx) => {
    await tx.segment.deleteMany({
      where: { userId: user.id, subcategoryId: parsed.data.id },
    })
    await tx.subcategory.deleteMany({
      where: { userId: user.id, id: parsed.data.id },
    })
  })

  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}

export async function deleteSegment(input: DeleteValues) {
  // Deletes a segment only if no Product references it.
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()

  const productCount = await prisma.product.count({
    where: { userId: user.id, segmentId: parsed.data.id },
  })
  if (productCount > 0) {
    return { ok: false as const, message: "Cannot delete: segment has products." }
  }

  await prisma.segment.deleteMany({
    where: { userId: user.id, id: parsed.data.id },
  })

  revalidatePath("/products/catalog-setup")
  revalidatePath("/products/add-product")
  return { ok: true as const }
}


