import { z } from "zod"

import prisma from "@/lib/prisma"
import { getApiUser, jsonError } from "@/lib/api"

const updatePricingProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    basedOn: z.string().min(1).optional(),
    priceAdjustMode: z.enum(["FIXED", "DYNAMIC"]).optional(),
    incrementMode: z.enum(["INCREASE", "DECREASE"]).optional(),
    status: z.enum(["DRAFT", "COMPLETED", "ARCHIVED"]).optional(),
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

  const p = await prisma.pricingProfile.findFirst({
    where: { id, userId: user.id },
    include: {
      productPricingProfiles: {
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
      },
    },
  })

  if (!p) return jsonError("Not found", 404)

  return Response.json({
    ok: true,
    item: {
      id: p.id,
      name: p.name,
      description: p.description,
      basedOn: p.basedOn,
      priceAdjustMode: p.priceAdjustMode,
      incrementMode: p.incrementMode,
      status: p.status,
      userId: p.userId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      productPricingProfiles: p.productPricingProfiles.map((ppp) => ({
        id: ppp.id,
        productId: ppp.productId,
        pricingProfileId: ppp.pricingProfileId,
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
  const parsed = updatePricingProfileSchema.safeParse(body)
  if (!parsed.success) return jsonError("Invalid body", 400)

  const existing = await prisma.pricingProfile.findFirst({ where: { id, userId: user.id } })
  if (!existing) return jsonError("Not found", 404)

  const updated = await prisma.pricingProfile.update({
    where: { id },
    data: parsed.data,
  })

  return Response.json({
    ok: true,
    item: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      basedOn: updated.basedOn,
      priceAdjustMode: updated.priceAdjustMode,
      incrementMode: updated.incrementMode,
      status: updated.status,
      userId: updated.userId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const existing = await prisma.pricingProfile.findFirst({ where: { id, userId: user.id } })
  if (!existing) return jsonError("Not found", 404)

  await prisma.$transaction(async (tx) => {
    await tx.productPricingProfile.deleteMany({ where: { pricingProfileId: id } })
    await tx.pricingProfile.delete({ where: { id } })
  })

  return Response.json({ ok: true })
}


