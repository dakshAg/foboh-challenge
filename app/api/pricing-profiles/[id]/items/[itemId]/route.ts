import { z } from "zod"

import prisma from "@/lib/prisma"
import { getApiUser, jsonError } from "@/lib/api"

const patchSchema = z
  .object({
    adjustment: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "Empty patch" })

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const profile = await prisma.pricingProfile.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!profile) return jsonError("Not found", 404)

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return jsonError("Invalid body", 400)

  const item = await prisma.productPricingProfile.findFirst({
    where: { id: itemId, pricingProfileId: id },
  })
  if (!item) return jsonError("Item not found", 404)

  const updated = await prisma.productPricingProfile.update({
    where: { id: itemId },
    data: parsed.data,
  })

  return Response.json({
    ok: true,
    item: {
      id: updated.id,
      pricingProfileId: updated.pricingProfileId,
      productId: updated.productId,
      adjustment: String(updated.adjustment),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
  const email = req.headers.get("x-user-email")
  const user = await getApiUser(email)

  const profile = await prisma.pricingProfile.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!profile) return jsonError("Not found", 404)

  const item = await prisma.productPricingProfile.findFirst({
    where: { id: itemId, pricingProfileId: id },
    select: { id: true },
  })
  if (!item) return jsonError("Item not found", 404)

  await prisma.productPricingProfile.delete({ where: { id: itemId } })
  return Response.json({ ok: true })
}


