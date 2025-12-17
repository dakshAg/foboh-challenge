"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalculatorIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react"

import { createPricingProfile } from "./actions"
import { calculatePricingPreview } from "./actions"
import {
  incrementModes,
  priceAdjustModes,
  pricingProfileSchema,
  type PricingProfileFormValues,
} from "./schema"

export function PricingProfileForm({
  products,
  categories,
  subcategories,
  segments,
  pricingProfiles,
}: {
  products: Array<{
    id: string
    title: string
    sku: string
    brand: string
    globalWholesalePrice: unknown
    categoryId: string
    subcategoryId: string
    segmentId: string
    category: { name: string }
    subcategory: { name: string }
    segment: { name: string }
  }>
  categories: Array<{ id: string; name: string }>
  subcategories: Array<{ id: string; name: string; categoryId: string }>
  segments: Array<{ id: string; name: string; subcategoryId: string }>
  pricingProfiles: Array<{ id: string; name: string; status: string; basedOn: string }>
}) {
  const [rootError, setRootError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const [selectionMode, setSelectionMode] = React.useState<"one" | "multiple" | "all">("multiple")

  const [query, setQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [subcategoryFilter, setSubcategoryFilter] = React.useState<string>("all")
  const [segmentFilter, setSegmentFilter] = React.useState<string>("all")
  const [brandFilter, setBrandFilter] = React.useState<string>("all")

  const form = useForm<PricingProfileFormValues>({
    resolver: zodResolver(pricingProfileSchema),
    defaultValues: {
      name: "",
      description: "",
      basedOn: "globalWholesalePrice",
      priceAdjustMode: "FIXED",
      incrementMode: "INCREASE",
      productIds: [],
      adjustments: {},
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

  // Keep selection mode effects in sync.
  React.useEffect(() => {
    if (selectionMode !== "all") return
    const allIds = products.map((p) => p.id)
    form.setValue("productIds", allIds, { shouldDirty: true })
    const current = form.getValues("adjustments") ?? {}
    const next: Record<string, string> = { ...current }
    for (const id of allIds) next[id] = next[id] ?? "0"
    form.setValue("adjustments", next, { shouldDirty: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode])

  const incrementMode = form.watch("incrementMode")
  const priceAdjustMode = form.watch("priceAdjustMode")
  const basedOn = form.watch("basedOn")
  const adjustmentTint =
    incrementMode === "DECREASE"
      ? "bg-destructive/5 ring-destructive/15 focus-within:ring-destructive/20"
      : "bg-emerald-500/5 ring-emerald-500/15 focus-within:ring-emerald-500/20"

  function parseMoney(v: unknown): number {
    const n = Number(String(v ?? "0"))
    return Number.isFinite(n) ? n : 0
  }

  function formatMoney(n: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n)
  }

  const brandOptions = React.useMemo(() => {
    const uniq = Array.from(
      new Set(products.map((p) => p.brand).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
    return uniq
  }, [products])

  const filteredSubcategoryOptions = React.useMemo(() => {
    if (categoryFilter === "all") return subcategories
    return subcategories.filter((s) => s.categoryId === categoryFilter)
  }, [subcategories, categoryFilter])

  const filteredSegmentOptions = React.useMemo(() => {
    if (subcategoryFilter === "all") return segments
    return segments.filter((s) => s.subcategoryId === subcategoryFilter)
  }, [segments, subcategoryFilter])

  React.useEffect(() => {
    // Reset dependent filters if parent changes.
    if (categoryFilter === "all") {
      setSubcategoryFilter("all")
      setSegmentFilter("all")
      return
    }
    if (
      subcategoryFilter !== "all" &&
      !subcategories.some((s) => s.id === subcategoryFilter && s.categoryId === categoryFilter)
    ) {
      setSubcategoryFilter("all")
      setSegmentFilter("all")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter])

  React.useEffect(() => {
    if (subcategoryFilter === "all") {
      setSegmentFilter("all")
      return
    }
    if (
      segmentFilter !== "all" &&
      !segments.some((s) => s.id === segmentFilter && s.subcategoryId === subcategoryFilter)
    ) {
      setSegmentFilter("all")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryFilter])

  const filteredProducts = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const tokens = q ? q.split(/\s+/g).filter(Boolean) : []

    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false
      if (subcategoryFilter !== "all" && p.subcategoryId !== subcategoryFilter) return false
      if (segmentFilter !== "all" && p.segmentId !== segmentFilter) return false
      if (brandFilter !== "all" && p.brand !== brandFilter) return false

      if (tokens.length === 0) return true
      const haystack = `${p.title} ${p.sku} ${p.brand}`.toLowerCase()
      return tokens.every((t) => haystack.includes(t))
    })
  }, [products, query, categoryFilter, subcategoryFilter, segmentFilter, brandFilter])

  const selectedIds = form.watch("productIds")
  const selectedProducts = React.useMemo(() => {
    const set = new Set(selectedIds)
    return products.filter((p) => set.has(p.id))
  }, [products, selectedIds])

  const adjustments = form.watch("adjustments")
  const [preview, setPreview] = React.useState<Record<string, { base: number; newPrice: number }>>({})
  const [isCalculating, setIsCalculating] = React.useState(false)
  const previewReqId = React.useRef(0)

  // Manual refresh function for pricing preview
  const refreshPricingPreview = React.useCallback(() => {
    if (selectedIds.length === 0) {
      setPreview({})
      setIsCalculating(false)
      return
    }

    const reqId = ++previewReqId.current
    setIsCalculating(true)

    startTransition(async () => {
      const res = await calculatePricingPreview({
        basedOn,
        priceAdjustMode,
        incrementMode,
        productIds: selectedIds,
        adjustments: adjustments ?? {},
      })

      // Ignore late responses.
      if (reqId !== previewReqId.current) return

      if (res && res.ok) {
        const next: Record<string, { base: number; newPrice: number }> = {}
        for (const [id, row] of Object.entries(res.byId)) {
          next[id] = { base: row.base, newPrice: row.newPrice }
        }
        setPreview(next)
      } else {
        setPreview({})
      }

      setIsCalculating(false)
    })
  }, [selectedIds, adjustments, basedOn, priceAdjustMode, incrementMode])

  function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = React.useState(value)
    React.useEffect(() => {
      const handle = window.setTimeout(() => setDebounced(value), delayMs)
      return () => window.clearTimeout(handle)
    }, [value, delayMs])
    return debounced
  }

  // Debounce server-side preview off adjustment typing.
  const debouncedAdjustments = useDebouncedValue(adjustments ?? {}, 400)

  const anyFiltersActive =
    query.trim().length > 0 ||
    categoryFilter !== "all" ||
    subcategoryFilter !== "all" ||
    segmentFilter !== "all" ||
    brandFilter !== "all"

  const activeFilterBadges = React.useMemo(() => {
    const badges: Array<{ key: string; label: string }> = []
    if (categoryFilter !== "all") {
      const c = categories.find((x) => x.id === categoryFilter)
      if (c) badges.push({ key: "cat", label: `Category: ${c.name}` })
    }
    if (subcategoryFilter !== "all") {
      const s = subcategories.find((x) => x.id === subcategoryFilter)
      if (s) badges.push({ key: "subcat", label: `Subcategory: ${s.name}` })
    }
    if (segmentFilter !== "all") {
      const s = segments.find((x) => x.id === segmentFilter)
      if (s) badges.push({ key: "seg", label: `Segment: ${s.name}` })
    }
    if (brandFilter !== "all") badges.push({ key: "brand", label: `Brand: ${brandFilter}` })
    if (query.trim().length) badges.push({ key: "q", label: `Search: “${query.trim()}”` })
    return badges
  }, [brandFilter, categoryFilter, query, segmentFilter, segments, subcategoryFilter, subcategories, categories])

  React.useEffect(() => {
    refreshPricingPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, debouncedAdjustments, priceAdjustMode, incrementMode, basedOn])

  const allPreviewReady =
    selectedIds.length === 0 ||
    selectedIds.every(
      (id) =>
        typeof preview[id]?.newPrice === "number" &&
        typeof preview[id]?.base === "number"
    )

  const negativeNewPriceIds = React.useMemo(() => {
    if (selectedIds.length === 0) return []
    return selectedIds.filter((id) => {
      const v = preview[id]?.newPrice
      return typeof v === "number" && v < 0
    })
  }, [selectedIds, preview])

  const negativeNewPriceError =
    negativeNewPriceIds.length > 0
      ? `New price cannot be negative (${negativeNewPriceIds.length} selected item${negativeNewPriceIds.length === 1 ? "" : "s"}). Adjust values and try again.`
      : null

  const submitDisabled =
    isPending ||
    isCalculating ||
    !allPreviewReady ||
    selectedIds.length === 0 ||
    negativeNewPriceIds.length > 0 ||
    (Object.keys(errors).length > 0 && !form.formState.isValid)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {selectedIds.length} selected
        </Badge>
        <Badge variant="outline">
          {Math.max(0, products.length - selectedIds.length)} unselected (uses “Based on”)
        </Badge>
        <Badge variant="secondary">
          {priceAdjustMode === "DYNAMIC" ? "Percent" : "Dollars"}
        </Badge>
        <Badge variant={incrementMode === "DECREASE" ? "destructive" : "secondary"}>
          {incrementMode === "DECREASE" ? "Decrease" : "Increase"}
        </Badge>
        {form.watch("basedOn") ? (
          <Badge variant="outline">
            Based on:{" "}
            {form.watch("basedOn") === "globalWholesalePrice"
              ? "Global wholesale price"
              : pricingProfiles.find((p) => p.id === form.watch("basedOn"))?.name ?? "Profile"}
          </Badge>
        ) : null}
        {isCalculating ? <Badge variant="outline">Calculating…</Badge> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>Configure your pricing profile settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pp-name">Name</FieldLabel>
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

            {rootError ? <FieldError>{rootError}</FieldError> : null}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Product select</CardTitle>
              <CardDescription>Select one or more products to include.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex">
                <RadioGroup
                  value={selectionMode}
                  onValueChange={(v) => setSelectionMode(v as typeof selectionMode)}
                  className="flex items-center gap-3"
                >
                  <label className="flex items-center gap-2 text-xs">
                    <RadioGroupItem value="one" />
                    One
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <RadioGroupItem value="multiple" />
                    Multiple
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <RadioGroupItem value="all" />
                    All
                  </label>
                </RadioGroup>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={filteredProducts.length === 0}
                onClick={() =>
                  form.setValue(
                    "productIds",
                    Array.from(new Set([...form.getValues("productIds"), ...filteredProducts.map((p) => p.id)])),
                    { shouldDirty: true }
                  )
                }
              >
                Select all (filtered)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={form.watch("productIds").length === 0}
                onClick={() => {
                  form.setValue("productIds", [], { shouldDirty: true })
                  form.setValue("adjustments", {}, { shouldDirty: true })
                  if (selectionMode === "all") setSelectionMode("multiple")
                }}
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
            <>
              <div className="mb-3 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-2">
                  <Input
                    placeholder="Search products (title, SKU, brand)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search products"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All subcategories</SelectItem>
                      {filteredSubcategoryOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All segments</SelectItem>
                      {filteredSegmentOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All brands</SelectItem>
                      {brandOptions.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-muted-foreground text-[0.625rem]">
                  Showing <span className="text-foreground font-medium">{filteredProducts.length}</span> of{" "}
                  <span className="text-foreground font-medium">{products.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilterBadges.map((b) => (
                    <Badge key={b.key} variant="outline">
                      {b.label}
                    </Badge>
                  ))}
                  {anyFiltersActive ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setQuery("")
                        setCategoryFilter("all")
                        setSubcategoryFilter("all")
                        setSegmentFilter("all")
                        setBrandFilter("all")
                      }}
                    >
                      Reset filters
                    </Button>
                  ) : null}
                </div>
              </div>

              <Controller
                name="productIds"
                control={form.control}
                render={({ field }) => {
                  const selected = new Set(field.value)
                  return (
                    <div className="divide-border/50 divide-y rounded-lg border">
                      {filteredProducts.map((p) => {
                        const checked = selected.has(p.id)
                        return (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-center gap-3 p-3"
                          >
                            <Checkbox
                              checked={checked}
                              disabled={selectionMode === "all"}
                              onCheckedChange={(v) => {
                                const next = new Set(field.value)
                                if (selectionMode === "one") {
                                  if (v === true) {
                                    next.clear()
                                    next.add(p.id)
                                  } else {
                                    next.delete(p.id)
                                  }
                                } else {
                                  if (v === true) next.add(p.id)
                                  else next.delete(p.id)
                                }
                                field.onChange(Array.from(next))

                                // Keep adjustments in sync with selection.
                                const current = form.getValues("adjustments") ?? {}
                                if (v === true) {
                                  form.setValue(
                                    `adjustments.${p.id}` as const,
                                    current[p.id] ?? "0",
                                    { shouldDirty: true }
                                  )
                                  // In "one" mode, clear other adjustments.
                                  if (selectionMode === "one") {
                                    const only: Record<string, string> = {}
                                    only[p.id] = current[p.id] ?? "0"
                                    form.setValue("adjustments", only, { shouldDirty: true })
                                  }
                                } else {
                                  const { [p.id]: _, ...rest } = current
                                  form.setValue("adjustments", rest, { shouldDirty: true })
                                }
                              }}
                              aria-label={`Select ${p.title}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium">{p.title}</div>
                              <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                                {p.brand} • {p.sku}
                              </div>
                              <div className="text-muted-foreground mt-0.5 text-[0.625rem]">
                                {p.category.name} / {p.subcategory.name} / {p.segment.name}
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
            </>
          )}
          <FieldError errors={[errors.productIds]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing configuration</CardTitle>
          <CardDescription>Configure how prices will be adjusted.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Based on</FieldLabel>
              <FieldContent>
                <Controller
                  name="basedOn"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select base price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="globalWholesalePrice">
                            Global wholesale price
                          </SelectItem>
                          {pricingProfiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} {p.status === "DRAFT" ? "(Draft)" : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  If a product isn't selected in the "Based on" profile, it falls back to that profile's base pricing.
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
          </FieldGroup>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <div className="flex items-end justify-between gap-2">
            <div>
              <CardTitle>Price adjust table</CardTitle>
              <CardDescription>
                Adjustments are local; new prices are calculated via server action.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={refreshPricingPreview}
                disabled={isCalculating || selectedIds.length === 0}
                className="h-7 px-2"
              >
                <RefreshCwIcon className={`size-3 ${isCalculating ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh pricing</span>
              </Button>
              <div className="text-muted-foreground text-[0.625rem]">
                {selectedProducts.length} items
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedProducts.length === 0 ? (
            <div className="text-muted-foreground text-xs/relaxed">
              No products selected yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Based on price</th>
                    <th className="px-3 py-2 font-medium">Adjustment</th>
                    <th className="px-3 py-2 font-medium">New price</th>
                  </tr>
                </thead>
                <tbody className="divide-border/50 divide-y">
                  {selectedProducts.map((p) => {
                    const adj = parseMoney(form.watch(`adjustments.${p.id}` as const) ?? "0")
                    const serverNew = preview[p.id]?.newPrice
                    const serverBase = preview[p.id]?.base
                    const base = typeof serverBase === "number" ? serverBase : 0
                    const delta =
                      priceAdjustMode === "DYNAMIC" ? base * (adj / 100) : adj
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium">{p.title}</div>
                          <div className="text-muted-foreground mt-0.5 text-[0.625rem]">{p.brand}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[0.625rem]">{p.sku}</td>
                        <td className="px-3 py-2">
                          {p.category.name}
                        </td>
                        <td className="px-3 py-2">{formatMoney(base)}</td>
                        <td className="px-3 py-2">
                          <div className="w-32">
                            <InputGroup className={adjustmentTint}>
                              {priceAdjustMode !== "DYNAMIC" ? (
                                <InputGroupAddon>
                                  <InputGroupText>$</InputGroupText>
                                </InputGroupAddon>
                              ) : null}
                              <InputGroupInput
                                inputMode="decimal"
                                placeholder={priceAdjustMode === "DYNAMIC" ? "0" : "0.00"}
                                {...form.register(`adjustments.${p.id}` as const)}
                                aria-invalid={!!errors.adjustments}
                              />
                              {priceAdjustMode === "DYNAMIC" ? (
                                <InputGroupAddon align="inline-end">
                                  <InputGroupText>%</InputGroupText>
                                </InputGroupAddon>
                              ) : null}
                            </InputGroup>
                          </div>
                          <div className="text-muted-foreground mt-1 text-[0.625rem]">
                            {incrementMode === "DECREASE" ? "−" : "+"}
                            {priceAdjustMode === "DYNAMIC" ? `${adj}%` : formatMoney(delta)}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {typeof serverNew === "number"
                            ? formatMoney(serverNew)
                            : isCalculating
                              ? "…"
                              : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <FieldError errors={[errors.adjustments]} />
        </CardContent>
      </Card>

      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        {selectedIds.length === 0 ? (
          <div className="text-muted-foreground mb-2 text-xs/relaxed">
            Select at least one product to create a profile.
          </div>
        ) : negativeNewPriceError ? (
          <div className="text-destructive mb-2 text-xs/relaxed">
            {negativeNewPriceError}
          </div>
        ) : isCalculating || !allPreviewReady ? (
          <div className="text-muted-foreground mb-2 text-xs/relaxed">
            Calculating new prices…
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => form.reset()}
        >
          Reset
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {isPending ? "Creating..." : "Create profile"}
        </Button>
      </div>
    </form>
  )
}


