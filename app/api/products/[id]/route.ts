import { z } from "zod"

import prisma from "@/lib/prisma"
import { getApiUser, jsonError } from "@/lib/api"

const updateProductSchema = z
  .object({
    title: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    subcategoryId: z.string().uuid().optional(),
    segmentId: z.string().uuid().optional(),
    globalWholesalePrice: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "Empty patch" })

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(req.url)
  const email = url.searchParams.get("userEmail") ?? req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const item = await prisma.product.findFirst({
    where: { id, userId: user.id },
    include: {
      category: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
      segment: { select: { id: true, name: true } },
    },
  })

  if (!item) return jsonError("Not found", 404)

  return Response.json({
    ok: true,
    item: {
      id: item.id,
      title: item.title,
      sku: item.sku,
      brand: item.brand,
      userId: item.userId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      segmentId: item.segmentId,
      globalWholesalePrice: String(item.globalWholesalePrice),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      category: item.category,
      subcategory: item.subcategory,
      segment: item.segment,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const body = await req.json().catch(() => null)
  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) return jsonError("Invalid body", 400)

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    })
    if (updated.userId !== user.id) return jsonError("Not found", 404)
    return Response.json({
      ok: true,
      item: {
        id: updated.id,
        title: updated.title,
        sku: updated.sku,
        brand: updated.brand,
        userId: updated.userId,
        categoryId: updated.categoryId,
        subcategoryId: updated.subcategoryId,
        segmentId: updated.segmentId,
        globalWholesalePrice: String(updated.globalWholesalePrice),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch {
    return jsonError("Could not update product", 400)
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const item = await prisma.product.findFirst({ where: { id, userId: user.id } })
  if (!item) return jsonError("Not found", 404)

  await prisma.product.delete({ where: { id } })
  return Response.json({ ok: true })
}


