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

export async function renameCategory(input: RenameValues) {
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
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()

  const productCount = await prisma.product.count({
    where: { userId: user.id, categoryId: parsed.data.id },
  })
  if (productCount > 0) {
    return { ok: false as const, message: "Cannot delete: category has products." }
  }

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
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, fieldErrors: parsed.error.flatten().fieldErrors }

  const user = await getDemoUser()

  const productCount = await prisma.product.count({
    where: { userId: user.id, subcategoryId: parsed.data.id },
  })
  if (productCount > 0) {
    return { ok: false as const, message: "Cannot delete: subcategory has products." }
  }

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


