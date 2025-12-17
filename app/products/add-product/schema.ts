import { z } from "zod"

const moneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,4})?$/, "Enter a valid number (up to 4 decimals)")

export const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  sku: z.string().min(1, "SKU is required"),
  brand: z.string().min(1, "Brand is required"),
  categoryId: z.string().uuid("Pick a category"),
  subcategoryId: z.string().uuid("Pick a subcategory"),
  segmentId: z.string().uuid("Pick a segment"),
  globalWholesalePrice: moneyString,
})

export type ProductFormValues = z.infer<typeof productSchema>


