"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createProduct } from "./actions"
import { productSchema, type ProductFormValues } from "./schema"
import Link from "next/link"

export function AddProductForm({
  categories,
  subcategories,
  segments,
}: {
  categories: Array<{ id: string; name: string }>
  subcategories: Array<{ id: string; name: string; categoryId: string }>
  segments: Array<{ id: string; name: string; subcategoryId: string }>
}) {
  const [rootError, setRootError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const defaultCategoryId = categories[0]?.id ?? ""
  const defaultSubcategoryId =
    subcategories.find((s) => s.categoryId === defaultCategoryId)?.id ??
    subcategories[0]?.id ??
    ""
  const defaultSegmentId =
    segments.find((s) => s.subcategoryId === defaultSubcategoryId)?.id ??
    segments[0]?.id ??
    ""

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      sku: "",
      brand: "",
      categoryId: defaultCategoryId,
      subcategoryId: defaultSubcategoryId,
      segmentId: defaultSegmentId,
      globalWholesalePrice: "0",
    },
    mode: "onBlur",
  })

  async function onSubmit(values: ProductFormValues) {
    setRootError(null)
    startTransition(async () => {
      const res = await createProduct(values)
      if (res && res.ok === false) {
        setRootError(res.message)
        const fieldErrors = res.fieldErrors ?? {}
        ;(Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).forEach((key) => {
          const msg = fieldErrors[key]?.[0]
          if (msg) form.setError(key as keyof ProductFormValues, { message: msg })
        })
      }
    })
  }

  const {
    formState: { errors },
  } = form

  const categoryId = form.watch("categoryId")
  const filteredSubcategories = React.useMemo(
    () => subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories, categoryId]
  )
  const subcategoryId = form.watch("subcategoryId")
  const filteredSegments = React.useMemo(
    () => segments.filter((s) => s.subcategoryId === subcategoryId),
    [segments, subcategoryId]
  )

  React.useEffect(() => {
    const current = form.getValues("subcategoryId")
    if (!current || !filteredSubcategories.some((s) => s.id === current)) {
      form.setValue("subcategoryId", filteredSubcategories[0]?.id ?? "", { shouldDirty: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  React.useEffect(() => {
    const current = form.getValues("segmentId")
    if (!current || !filteredSegments.some((s) => s.id === current)) {
      form.setValue("segmentId", filteredSegments[0]?.id ?? "", { shouldDirty: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>
            Required fields from the Prisma schema. Set up categories first in{" "}
            <Link href="/products/catalog-setup" className="underline underline-offset-4">
              Catalog setup
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="prod-title">Title</FieldLabel>
              <FieldContent>
                <Input id="prod-title" placeholder="e.g. Foam Roller" {...form.register("title")} aria-invalid={!!errors.title} />
                <FieldError errors={[errors.title]} />
              </FieldContent>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="prod-sku">SKU</FieldLabel>
                <FieldContent>
                  <Input id="prod-sku" placeholder="e.g. FOAM-ROLLER-01" {...form.register("sku")} aria-invalid={!!errors.sku} />
                  <FieldDescription>Must be unique.</FieldDescription>
                  <FieldError errors={[errors.sku]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="prod-brand">Brand</FieldLabel>
                <FieldContent>
                  <Input id="prod-brand" placeholder="e.g. Foboh" {...form.register("brand")} aria-invalid={!!errors.brand} />
                  <FieldError errors={[errors.brand]} />
                </FieldContent>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel>Category</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("categoryId")}
                    onValueChange={(v) => form.setValue("categoryId", v, { shouldDirty: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.categoryId]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Subcategory</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("subcategoryId")}
                    onValueChange={(v) => form.setValue("subcategoryId", v, { shouldDirty: true })}
                    disabled={filteredSubcategories.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filteredSubcategories.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.subcategoryId]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Segment</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("segmentId")}
                    onValueChange={(v) => form.setValue("segmentId", v, { shouldDirty: true })}
                    disabled={filteredSegments.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filteredSegments.map((seg) => (
                          <SelectItem key={seg.id} value={seg.id}>
                            {seg.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.segmentId]} />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="prod-price">Global wholesale price</FieldLabel>
              <FieldContent>
                <Input id="prod-price" inputMode="decimal" placeholder="0.00" {...form.register("globalWholesalePrice")} aria-invalid={!!errors.globalWholesalePrice} />
                <FieldDescription>Stored as a decimal in Postgres.</FieldDescription>
                <FieldError errors={[errors.globalWholesalePrice]} />
              </FieldContent>
            </Field>

            {rootError ? <FieldError>{rootError}</FieldError> : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create product"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => form.reset()}>
            Reset
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}


