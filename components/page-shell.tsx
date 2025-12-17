import * as React from "react"

import { cn } from "@/lib/utils"

export function PageShell({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl", className)}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-muted-foreground text-xs/relaxed">{description}</div>
          <h1 className="text-foreground mt-1 text-xl font-semibold">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}


