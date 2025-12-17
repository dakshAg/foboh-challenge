import { z } from "zod"

export const priceAdjustModes = ["FIXED", "DYNAMIC"] as const
export const incrementModes = ["INCREASE", "DECREASE"] as const

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,4})?$/, "Enter a valid number (up to 4 decimals)")

export const pricingProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(1, "Description is required"),
  basedOn: z.string().min(1, "Based on is required"),
  priceAdjustMode: z.enum(priceAdjustModes),
  incrementMode: z.enum(incrementModes),
  productIds: z.array(z.string().uuid()),
  adjustments: z.record(z.string(), moneyString),
})

export type PricingProfileFormValues = z.infer<typeof pricingProfileSchema>


