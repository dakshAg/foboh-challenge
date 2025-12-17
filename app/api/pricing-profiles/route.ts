import { z } from "zod"

import prisma from "@/lib/prisma"
import { getApiUser, jsonError } from "@/lib/api"

const createPricingProfileSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  basedOn: z.string().min(1),
  priceAdjustMode: z.enum(["FIXED", "DYNAMIC"]),
  incrementMode: z.enum(["INCREASE", "DECREASE"]),
  status: z.enum(["DRAFT", "COMPLETED", "ARCHIVED"]).optional(),
  // Optional initial items
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        adjustment: z.string().regex(/^\d+(\.\d{1,4})?$/),
      })
    )
    .optional(),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get("userEmail") ?? req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const items = await prisma.pricingProfile.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
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

  return Response.json({
    ok: true,
    items: items.map((p) => ({
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
    })),
  })
}

export async function POST(req: Request) {
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const body = await req.json().catch(() => null)
  const parsed = createPricingProfileSchema.safeParse(body)
  if (!parsed.success) return jsonError("Invalid body", 400)

  const created = await prisma.pricingProfile.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      basedOn: parsed.data.basedOn,
      priceAdjustMode: parsed.data.priceAdjustMode,
      incrementMode: parsed.data.incrementMode,
      status: parsed.data.status ?? "DRAFT",
      productPricingProfiles: parsed.data.items?.length
        ? {
            create: parsed.data.items.map((i) => ({
              productId: i.productId,
              adjustment: i.adjustment,
            })),
          }
        : undefined,
    },
  })

  return Response.json(
    {
      ok: true,
      item: {
        id: created.id,
        name: created.name,
        description: created.description,
        basedOn: created.basedOn,
        priceAdjustMode: created.priceAdjustMode,
        incrementMode: created.incrementMode,
        status: created.status,
        userId: created.userId,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  )
}


