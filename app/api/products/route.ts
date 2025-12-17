import { z } from "zod"

import prisma from "@/lib/prisma"
import { getApiUser, jsonError } from "@/lib/api"

const createProductSchema = z.object({
  title: z.string().min(1),
  sku: z.string().min(1),
  brand: z.string().min(1),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid(),
  segmentId: z.string().uuid(),
  globalWholesalePrice: z.string().regex(/^\d+(\.\d{1,4})?$/),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get("userEmail") ?? req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const items = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
      segment: { select: { id: true, name: true } },
    },
  })

  return Response.json({
    ok: true,
    items: items.map((p) => ({
      id: p.id,
      title: p.title,
      sku: p.sku,
      brand: p.brand,
      userId: p.userId,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      segmentId: p.segmentId,
      globalWholesalePrice: String(p.globalWholesalePrice),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: p.category,
      subcategory: p.subcategory,
      segment: p.segment,
    })),
  })
}

export async function POST(req: Request) {
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const body = await req.json().catch(() => null)
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid body", 400)
  }

  try {
    const created = await prisma.product.create({
      data: { ...parsed.data, userId: user.id },
    })
    return Response.json(
      {
        ok: true,
        item: {
          id: created.id,
          title: created.title,
          sku: created.sku,
          brand: created.brand,
          userId: created.userId,
          categoryId: created.categoryId,
          subcategoryId: created.subcategoryId,
          segmentId: created.segmentId,
          globalWholesalePrice: String(created.globalWholesalePrice),
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch {
    return jsonError("Could not create product (maybe duplicate SKU)", 409)
  }
}


