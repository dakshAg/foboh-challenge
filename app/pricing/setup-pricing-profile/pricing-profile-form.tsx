"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalculatorIcon,
  SparklesIcon,
} from "lucide-react"

import { createPricingProfile } from "./actions"
import {
  incrementModes,
  priceAdjustModes,
  pricingProfileSchema,
  type PricingProfileFormValues,
} from "./schema"

export function PricingProfileForm({
  products,
}: {
  products: Array<{ id: string; title: string; sku: string; brand: string }>
}) {
  const [rootError, setRootError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<PricingProfileFormValues>({
    resolver: zodResolver(pricingProfileSchema),
    defaultValues: {
      name: "",
      description: "",
      basedOn: "globalWholesalePrice",
      priceAdjustMode: "FIXED",
      incrementMode: "INCREASE",
      productIds: [],
    },
    mode: "onBlur",
  })

  async function onSubmit(values: PricingProfileFormValues) {
    setRootError(null)

    startTransition(async () => {
      const res = await createPricingProfile(values)

      if (res && res.ok === false) {
        setRootError(res.message)

        const fieldErrors = res.fieldErrors ?? {}
        ;(Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).forEach((key) => {
          const msg = fieldErrors[key]?.[0]
          if (msg) {
            form.setError(key as keyof PricingProfileFormValues, { message: msg })
          }
        })
      }
    })
  }

  const {
    formState: { errors },
  } = form

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic details</CardTitle>
          <CardDescription>Match the fields in the Prisma schema.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pp-name">Profile name</FieldLabel>
              <FieldContent>
                <Input
                  id="pp-name"
                  placeholder="e.g. Wholesale - West Coast"
                  {...form.register("name")}
                  aria-invalid={!!errors.name}
                />
                <FieldDescription>Shown in the pricing profiles list.</FieldDescription>
                <FieldError errors={[errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="pp-description">Description</FieldLabel>
              <FieldContent>
                <Textarea
                  id="pp-description"
                  placeholder="Short description of who this profile applies to…"
                  {...form.register("description")}
                  aria-invalid={!!errors.description}
                />
                <FieldError errors={[errors.description]} />
              </FieldContent>
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="pp-based-on">Based on</FieldLabel>
                <FieldContent>
                  <Input
                    id="pp-based-on"
                    placeholder="e.g. globalWholesalePrice"
                    {...form.register("basedOn")}
                    aria-invalid={!!errors.basedOn}
                  />
                  <FieldDescription>
                    For now this is a freeform string; later you can constrain it.
                  </FieldDescription>
                  <FieldError errors={[errors.basedOn]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Price adjust mode</FieldLabel>
                <FieldContent>
                  <Controller
                    name="priceAdjustMode"
                    control={form.control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={(v) => field.onChange(v)}
                        className="grid gap-2"
                      >
                        <label
                          className="ring-foreground/10 has-[:checked]:ring-primary/40 has-[:checked]:bg-muted/40 bg-card rounded-lg p-3 ring-1 transition-colors flex items-start gap-3 cursor-pointer"
                          htmlFor="pp-pam-fixed"
                        >
                          <RadioGroupItem id="pp-pam-fixed" value="FIXED" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <CalculatorIcon className="size-3.5" />
                              Fixed
                            </div>
                            <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                              Apply a fixed adjustment per product/profile.
                            </div>
                          </div>
                        </label>

                        <label
                          className="ring-foreground/10 has-[:checked]:ring-primary/40 has-[:checked]:bg-muted/40 bg-card rounded-lg p-3 ring-1 transition-colors flex items-start gap-3 cursor-pointer"
                          htmlFor="pp-pam-dynamic"
                        >
                          <RadioGroupItem id="pp-pam-dynamic" value="DYNAMIC" className="mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <SparklesIcon className="size-3.5" />
                              Dynamic
                            </div>
                            <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                              Compute adjustment from rules (placeholder).
                            </div>
                          </div>
                        </label>
                      </RadioGroup>
                    )}
                  />
                  <FieldError errors={[errors.priceAdjustMode]} />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>Increment mode</FieldLabel>
              <FieldContent>
                <Controller
                  name="incrementMode"
                  control={form.control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                      className="grid gap-2"
                    >
                      <label
                        className="ring-foreground/10 has-[:checked]:ring-primary/40 has-[:checked]:bg-muted/40 bg-card rounded-lg p-3 ring-1 transition-colors flex items-start gap-3 cursor-pointer"
                        htmlFor="pp-inc-increase"
                      >
                        <RadioGroupItem id="pp-inc-increase" value="INCREASE" className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <ArrowUpIcon className="size-3.5" />
                            Increase
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                            Add adjustment to the base price.
                          </div>
                        </div>
                      </label>

                      <label
                        className="ring-foreground/10 has-[:checked]:ring-primary/40 has-[:checked]:bg-muted/40 bg-card rounded-lg p-3 ring-1 transition-colors flex items-start gap-3 cursor-pointer"
                        htmlFor="pp-inc-decrease"
                      >
                        <RadioGroupItem id="pp-inc-decrease" value="DECREASE" className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <ArrowDownIcon className="size-3.5" />
                            Decrease
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                            Subtract adjustment from the base price.
                          </div>
                        </div>
                      </label>
                    </RadioGroup>
                  )}
                />
                <FieldError errors={[errors.incrementMode]} />
              </FieldContent>
            </Field>

            {rootError ? <FieldError>{rootError}</FieldError> : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create profile"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => form.reset()}>
            Reset
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Select one or more products to include.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={products.length === 0}
                onClick={() => form.setValue("productIds", products.map((p) => p.id), { shouldDirty: true })}
              >
                Select all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={form.watch("productIds").length === 0}
                onClick={() => form.setValue("productIds", [], { shouldDirty: true })}
              >
                Deselect all
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-muted-foreground text-xs/relaxed">
              No products found for this user yet.
            </div>
          ) : (
            <Controller
              name="productIds"
              control={form.control}
              render={({ field }) => {
                const selected = new Set(field.value)
                return (
                  <div className="divide-border/50 divide-y rounded-lg border">
                    {products.map((p) => {
                      const checked = selected.has(p.id)
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 p-3"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = new Set(field.value)
                              if (v === true) next.add(p.id)
                              else next.delete(p.id)
                              field.onChange(Array.from(next))
                            }}
                            aria-label={`Select ${p.title}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium">{p.title}</div>
                            <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                              {p.brand} • {p.sku}
                            </div>
                          </div>
                          <div className="text-muted-foreground text-[0.625rem]">
                            {checked ? "Selected" : ""}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )
              }}
            />
          )}
          <FieldError errors={[errors.productIds]} />
        </CardContent>
      </Card>
    </form>
  )
}


