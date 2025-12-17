"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  createCategory,
  createSegment,
  createSubcategory,
  deleteCategory,
  deleteSegment,
  deleteSubcategory,
  renameCategory,
  renameSegment,
  renameSubcategory,
} from "./actions"

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

  const [editing, setEditing] = React.useState<
    | { kind: "category"; id: string; value: string }
    | { kind: "subcategory"; id: string; value: string }
    | { kind: "segment"; id: string; value: string }
    | null
  >(null)

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

  function beginRename(kind: NonNullable<typeof editing>["kind"], id: string, value: string) {
    setError(null)
    setEditing({ kind, id, value })
  }

  function cancelRename() {
    setEditing(null)
  }

  async function confirmRename() {
    if (!editing) return
    setError(null)
    startTransition(async () => {
      const name = editing.value.trim()
      if (!name) {
        setError("Name is required.")
        return
      }

      const res =
        editing.kind === "category"
          ? await renameCategory({ id: editing.id, name })
          : editing.kind === "subcategory"
            ? await renameSubcategory({ id: editing.id, name })
            : await renameSegment({ id: editing.id, name })

      if (!res.ok) {
        setError(res.message ?? "Could not rename.")
        return
      }

      setEditing(null)
      router.refresh()
    })
  }

  async function confirmDelete(kind: "category" | "subcategory" | "segment", id: string) {
    setError(null)
    startTransition(async () => {
      const res =
        kind === "category"
          ? await deleteCategory({ id })
          : kind === "subcategory"
            ? await deleteSubcategory({ id })
            : await deleteSegment({ id })

      if (!res.ok) {
        setError(res.message ?? "Could not delete.")
        return
      }

      // If we deleted the active node, reset selection.
      if (kind === "category" && id === selectedCategoryId) setSelectedCategoryId(categories[0]?.id ?? "")
      if (kind === "subcategory" && id === selectedSubcategoryId) setSelectedSubcategoryId("")

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
                <Row
                  active={active}
                  icon={active ? <FolderOpenIcon className="size-3.5" /> : <FolderIcon className="size-3.5" />}
                  label={c.name}
                  editing={editing?.kind === "category" && editing.id === c.id}
                  editingValue={editing?.kind === "category" && editing.id === c.id ? editing.value : ""}
                  onChangeEditingValue={(v) => setEditing((prev) => (prev && prev.kind === "category" && prev.id === c.id ? { ...prev, value: v } : prev))}
                  onSelect={() => {
                    setSelectedCategoryId(c.id)
                    setError(null)
                  }}
                  onRename={() => beginRename("category", c.id, c.name)}
                  onCancelRename={cancelRename}
                  onConfirmRename={confirmRename}
                  onDelete={() => confirmDelete("category", c.id)}
                  disabled={isPending}
                  confirm={{
                    title: "Delete category?",
                    description: "This will also remove its subcategories and segments (only if no products reference them).",
                  }}
                />
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
                <Row
                  active={active}
                  icon={active ? <FolderOpenIcon className="size-3.5" /> : <FolderIcon className="size-3.5" />}
                  label={s.name}
                  editing={editing?.kind === "subcategory" && editing.id === s.id}
                  editingValue={editing?.kind === "subcategory" && editing.id === s.id ? editing.value : ""}
                  onChangeEditingValue={(v) => setEditing((prev) => (prev && prev.kind === "subcategory" && prev.id === s.id ? { ...prev, value: v } : prev))}
                  onSelect={() => {
                    setSelectedSubcategoryId(s.id)
                    setError(null)
                  }}
                  onRename={() => beginRename("subcategory", s.id, s.name)}
                  onCancelRename={cancelRename}
                  onConfirmRename={confirmRename}
                  onDelete={() => confirmDelete("subcategory", s.id)}
                  disabled={isPending}
                  confirm={{
                    title: "Delete subcategory?",
                    description: "This will also remove its segments (only if no products reference them).",
                  }}
                />
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
            <li key={seg.id}>
              <Row
                active={false}
                icon={
                  <span className="bg-muted inline-flex size-4 items-center justify-center rounded-sm">
                    <span className="bg-foreground size-1.5 rounded-full" />
                  </span>
                }
                label={seg.name}
                editing={editing?.kind === "segment" && editing.id === seg.id}
                editingValue={editing?.kind === "segment" && editing.id === seg.id ? editing.value : ""}
                onChangeEditingValue={(v) => setEditing((prev) => (prev && prev.kind === "segment" && prev.id === seg.id ? { ...prev, value: v } : prev))}
                onSelect={() => setError(null)}
                onRename={() => beginRename("segment", seg.id, seg.name)}
                onCancelRename={cancelRename}
                onConfirmRename={confirmRename}
                onDelete={() => confirmDelete("segment", seg.id)}
                disabled={isPending}
                confirm={{
                  title: "Delete segment?",
                  description: "You can’t delete a segment that’s referenced by products.",
                }}
              />
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

function Row({
  active,
  icon,
  label,
  editing,
  editingValue,
  onChangeEditingValue,
  onSelect,
  onRename,
  onCancelRename,
  onConfirmRename,
  onDelete,
  disabled,
  confirm,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  editing: boolean
  editingValue: string
  onChangeEditingValue: (v: string) => void
  onSelect: () => void
  onRename: () => void
  onCancelRename: () => void
  onConfirmRename: () => void
  onDelete: () => void
  disabled: boolean
  confirm: { title: string; description: string }
}) {
  return (
    <div
      className={cn(
        "hover:bg-muted/60 group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        active && "bg-muted"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        disabled={disabled}
      >
        {icon}
        {editing ? (
          <span className="flex w-full items-center gap-2">
            <Input
              value={editingValue}
              onChange={(e) => onChangeEditingValue(e.target.value)}
              className="h-7"
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancelRename()
                if (e.key === "Enter") onConfirmRename()
              }}
              autoFocus
            />
          </span>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </button>

      {editing ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={disabled || editingValue.trim().length === 0}
            aria-label="Save"
            onClick={onConfirmRename}
          >
            <CheckIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            aria-label="Cancel"
            onClick={onCancelRename}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            aria-label="Rename"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRename()
            }}
          >
            <PencilIcon />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label="Delete"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <Trash2Icon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
                <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
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

