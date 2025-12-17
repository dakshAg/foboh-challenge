import { z } from "zod"

import prisma from "@/lib/prisma"
import { getApiUser, jsonError } from "@/lib/api"

const createItemSchema = z.object({
  productId: z.string().uuid(),
  adjustment: z.string().regex(/^\d+(\.\d{1,4})?$/),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(req.url)
  const email = url.searchParams.get("userEmail") ?? req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const profile = await prisma.pricingProfile.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!profile) return jsonError("Not found", 404)

  const items = await prisma.productPricingProfile.findMany({
    where: { pricingProfileId: id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          sku: true,
          brand: true,
          globalWholesalePrice: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return Response.json({
    ok: true,
    items: items.map((ppp) => ({
      id: ppp.id,
      pricingProfileId: ppp.pricingProfileId,
      productId: ppp.productId,
      adjustment: String(ppp.adjustment),
      createdAt: ppp.createdAt.toISOString(),
      updatedAt: ppp.updatedAt.toISOString(),
      product: {
        id: ppp.product.id,
        title: ppp.product.title,
        sku: ppp.product.sku,
        brand: ppp.product.brand,
        globalWholesalePrice: String(ppp.product.globalWholesalePrice),
      },
    })),
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const profile = await prisma.pricingProfile.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!profile) return jsonError("Not found", 404)

  const body = await req.json().catch(() => null)
  const parsed = createItemSchema.safeParse(body)
  if (!parsed.success) return jsonError("Invalid body", 400)

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, userId: user.id },
    select: { id: true },
  })
  if (!product) return jsonError("Product not found", 404)

  const existing = await prisma.productPricingProfile.findFirst({
    where: { pricingProfileId: id, productId: parsed.data.productId },
    select: { id: true },
  })

  const item = existing
    ? await prisma.productPricingProfile.update({
        where: { id: existing.id },
        data: { adjustment: parsed.data.adjustment },
      })
    : await prisma.productPricingProfile.create({
        data: {
          pricingProfileId: id,
          productId: parsed.data.productId,
          adjustment: parsed.data.adjustment,
        },
      })

  return Response.json(
    {
      ok: true,
      item: {
        id: item.id,
        pricingProfileId: item.pricingProfileId,
        productId: item.productId,
        adjustment: String(item.adjustment),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    },
    { status: existing ? 200 : 201 }
  )
}


