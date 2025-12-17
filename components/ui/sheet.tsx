"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 z-50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "bg-background ring-foreground/10 data-open:animate-in data-closed:animate-out duration-150 fixed z-50 grid gap-3 p-4 shadow-lg ring-1 outline-none",
          "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-80 data-[side=right]:border-l data-[side=right]:data-open:slide-in-from-right-2 data-[side=right]:data-closed:slide-out-to-right-2",
          "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-80 data-[side=left]:border-r data-[side=left]:data-open:slide-in-from-left-2 data-[side=left]:data-closed:slide-out-to-left-2",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-open:slide-in-from-top-2 data-[side=top]:data-closed:slide-out-to-top-2",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-open:slide-in-from-bottom-2 data-[side=bottom]:data-closed:slide-out-to-bottom-2",
          className
        )}
        {...props}
      />
    </SheetPortal>
  )
}

function SheetClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function SheetTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="sheet-title" {...props} />
}

function SheetDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="sheet-description" {...props} />
}

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}


