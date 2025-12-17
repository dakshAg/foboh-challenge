import { z } from "zod"

export const priceAdjustModes = ["FIXED", "DYNAMIC"] as const
export const incrementModes = ["INCREASE", "DECREASE"] as const

export const pricingProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(1, "Description is required"),
  basedOn: z.string().min(1, "Based on is required"),
  priceAdjustMode: z.enum(priceAdjustModes),
  incrementMode: z.enum(incrementModes),
  productIds: z.array(z.string().uuid()),
})

export type PricingProfileFormValues = z.infer<typeof pricingProfileSchema>


