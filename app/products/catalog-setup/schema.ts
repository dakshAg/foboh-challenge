import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
})

export const subcategorySchema = z.object({
  categoryId: z.string().uuid("Pick a category"),
  name: z.string().min(1, "Subcategory name is required"),
})

export const segmentSchema = z.object({
  subcategoryId: z.string().uuid("Pick a subcategory"),
  name: z.string().min(1, "Segment name is required"),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
export type SubcategoryFormValues = z.infer<typeof subcategorySchema>
export type SegmentFormValues = z.infer<typeof segmentSchema>


