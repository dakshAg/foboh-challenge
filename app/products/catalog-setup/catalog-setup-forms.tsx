"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, FolderIcon, FolderOpenIcon, PlusIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { createCategory, createSegment, createSubcategory } from "./actions"

export function CatalogSetupForms({
  categories,
  subcategories,
  segments,
}: {
  categories: Array<{ id: string; name: string }>
  subcategories: Array<{ id: string; name: string; categoryId: string }>
  segments: Array<{ id: string; name: string; subcategoryId: string }>
}) {
  const router = useRouter()

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>(
    categories[0]?.id ?? ""
  )
  const filteredSubcategories = React.useMemo(
    () => subcategories.filter((s) => s.categoryId === selectedCategoryId),
    [subcategories, selectedCategoryId]
  )

  const [selectedSubcategoryId, setSelectedSubcategoryId] = React.useState<string>(
    filteredSubcategories[0]?.id ?? ""
  )
  const filteredSegments = React.useMemo(
    () => segments.filter((s) => s.subcategoryId === selectedSubcategoryId),
    [segments, selectedSubcategoryId]
  )

  // Keep selections valid as data changes.
  React.useEffect(() => {
    if (selectedCategoryId && categories.some((c) => c.id === selectedCategoryId)) return
    setSelectedCategoryId(categories[0]?.id ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

  React.useEffect(() => {
    if (
      selectedSubcategoryId &&
      filteredSubcategories.some((s) => s.id === selectedSubcategoryId)
    ) {
      return
    }
    setSelectedSubcategoryId(filteredSubcategories[0]?.id ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, filteredSubcategories.length])

  const [newCategoryOpen, setNewCategoryOpen] = React.useState(false)
  const [newSubcategoryOpen, setNewSubcategoryOpen] = React.useState(false)
  const [newSegmentOpen, setNewSegmentOpen] = React.useState(false)

  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [newSubcategoryName, setNewSubcategoryName] = React.useState("")
  const [newSegmentName, setNewSegmentName] = React.useState("")

  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const canAddSubcategory = !!selectedCategoryId
  const canAddSegment = !!selectedSubcategoryId

  async function onAddCategory() {
    setError(null)
    startTransition(async () => {
      const res = await createCategory({ name: newCategoryName })
      if (!res.ok) {
        setError(res.fieldErrors?.name?.[0] ?? "Could not create category.")
        return
      }
      setNewCategoryName("")
      setNewCategoryOpen(false)
      router.refresh()
    })
  }

  async function onAddSubcategory() {
    if (!selectedCategoryId) return
    setError(null)
    startTransition(async () => {
      const res = await createSubcategory({ categoryId: selectedCategoryId, name: newSubcategoryName })
      if (!res.ok) {
        setError(res.fieldErrors?.name?.[0] ?? "Could not create subcategory.")
        return
      }
      setNewSubcategoryName("")
      setNewSubcategoryOpen(false)
      router.refresh()
    })
  }

  async function onAddSegment() {
    if (!selectedSubcategoryId) return
    setError(null)
    startTransition(async () => {
      const res = await createSegment({ subcategoryId: selectedSubcategoryId, name: newSegmentName })
      if (!res.ok) {
        setError(res.fieldErrors?.name?.[0] ?? "Could not create segment.")
        return
      }
      setNewSegmentName("")
      setNewSegmentOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <NavColumn
        title="Categories"
        empty="No categories yet."
        isPending={isPending}
        addDisabled={false}
        addOpen={newCategoryOpen}
        onToggleAdd={() => {
          setError(null)
          setNewCategoryOpen((v) => !v)
        }}
        addValue={newCategoryName}
        onChangeAddValue={setNewCategoryName}
        onCancelAdd={() => {
          setError(null)
          setNewCategoryOpen(false)
          setNewCategoryName("")
        }}
        onConfirmAdd={onAddCategory}
      >
        <ul className="space-y-1">
          {categories.map((c) => {
            const active = c.id === selectedCategoryId
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(c.id)
                    setError(null)
                  }}
                  className={cn(
                    "hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    active && "bg-muted"
                  )}
                >
                  {active ? <FolderOpenIcon className="size-3.5" /> : <FolderIcon className="size-3.5" />}
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </NavColumn>

      <NavColumn
        title="Subcategories"
        empty={selectedCategoryId ? "No subcategories yet." : "Select a category first."}
        isPending={isPending}
        addDisabled={!canAddSubcategory}
        addOpen={newSubcategoryOpen}
        onToggleAdd={() => {
          setError(null)
          setNewSubcategoryOpen((v) => !v)
        }}
        addValue={newSubcategoryName}
        onChangeAddValue={setNewSubcategoryName}
        onCancelAdd={() => {
          setError(null)
          setNewSubcategoryOpen(false)
          setNewSubcategoryName("")
        }}
        onConfirmAdd={onAddSubcategory}
      >
        <ul className="space-y-1">
          {filteredSubcategories.map((s) => {
            const active = s.id === selectedSubcategoryId
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubcategoryId(s.id)
                    setError(null)
                  }}
                  className={cn(
                    "hover:bg-muted/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    active && "bg-muted"
                  )}
                >
                  {active ? <FolderOpenIcon className="size-3.5" /> : <FolderIcon className="size-3.5" />}
                  <span className="truncate">{s.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </NavColumn>

      <NavColumn
        title="Segments"
        empty={selectedSubcategoryId ? "No segments yet." : "Select a subcategory first."}
        isPending={isPending}
        addDisabled={!canAddSegment}
        addOpen={newSegmentOpen}
        onToggleAdd={() => {
          setError(null)
          setNewSegmentOpen((v) => !v)
        }}
        addValue={newSegmentName}
        onChangeAddValue={setNewSegmentName}
        onCancelAdd={() => {
          setError(null)
          setNewSegmentOpen(false)
          setNewSegmentName("")
        }}
        onConfirmAdd={onAddSegment}
      >
        <ul className="space-y-1">
          {filteredSegments.map((seg) => (
            <li key={seg.id} className="px-2 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-muted inline-flex size-4 items-center justify-center rounded-sm">
                  <span className="bg-foreground size-1.5 rounded-full" />
                </span>
                <span className="truncate">{seg.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </NavColumn>

      {error ? (
        <div className="text-destructive text-xs/relaxed lg:col-span-3">{error}</div>
      ) : null}
    </div>
  )
}

function NavColumn({
  title,
  empty,
  children,
  addOpen,
  addDisabled,
  addValue,
  onChangeAddValue,
  onToggleAdd,
  onCancelAdd,
  onConfirmAdd,
  isPending,
}: React.PropsWithChildren<{
  title: string
  empty: string
  addOpen: boolean
  addDisabled: boolean
  addValue: string
  onChangeAddValue: (v: string) => void
  onToggleAdd: () => void
  onCancelAdd: () => void
  onConfirmAdd: () => void
  isPending: boolean
}>) {
  return (
    <div className="bg-card ring-foreground/10 flex min-h-[24rem] flex-col rounded-lg ring-1">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="text-xs font-medium">{title}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={addDisabled || isPending}
          aria-label={`Add ${title}`}
          onClick={onToggleAdd}
        >
          <PlusIcon />
        </Button>
      </div>

      {addOpen ? (
        <div className="border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              value={addValue}
              onChange={(e) => onChangeAddValue(e.target.value)}
              placeholder={`New ${title.toLowerCase().slice(0, -1)} name`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancelAdd()
                if (e.key === "Enter") onConfirmAdd()
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isPending || addValue.trim().length === 0}
              aria-label="Confirm"
              onClick={onConfirmAdd}
            >
              <CheckIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              aria-label="Cancel"
              onClick={onCancelAdd}
            >
              <XIcon />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-auto p-2">
        {children}
        {/* Empty state for list-based callers */}
        {children &&
        // @ts-expect-error runtime check: if children is a single <ul>
        children?.props?.children?.length === 0 ? (
          <div className="text-muted-foreground px-1 text-xs/relaxed">{empty}</div>
        ) : null}
      </div>
    </div>
  )
}

