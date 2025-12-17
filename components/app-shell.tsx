"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BellIcon,
  BoxIcon,
  CreditCardIcon,
  ChevronDownIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PackageIcon,
  PuzzleIcon,
  ReceiptIcon,
  SettingsIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/orders", label: "Orders", icon: ReceiptIcon },
  { href: "/customers", label: "Customers", icon: UsersIcon },
  { href: "/products", label: "Products", icon: BoxIcon },
  { href: "/pricing", label: "Pricing", icon: CreditCardIcon },
  { href: "/freight", label: "Freight", icon: TruckIcon },
  { href: "/integrations", label: "Integrations", icon: PuzzleIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ComponentType<React.ComponentProps<"svg">>
  active: boolean
  onClick?: () => void
}) {
  return (
    <Button
      asChild
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="justify-start"
    >
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
      >
        <Icon data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="bg-background min-h-dvh">
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
        <div className="flex h-12 items-center gap-3 px-4">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-[min(42vw,420px)] md:block">
              <Input placeholder="Search..." aria-label="Search" />
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation"
                >
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-3">
                <div className="flex items-center px-1 py-1">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={140}
                    height={32}
                    priority
                    className="h-8 w-auto"
                  />
                </div>
                <Separator className="my-3" />
                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={pathname === item.href}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
                  <div className="hidden sm:block text-right">
                    <div className="text-muted-foreground text-[0.625rem] leading-none">
                      Foboh Inc.
                    </div>
                    <div className="text-xs font-medium leading-none">
                      Daksh Agrawal
                    </div>
                  </div>
                  <div className="bg-muted inline-flex size-7 items-center justify-center rounded-md sm:hidden">
                    <UserIcon className="size-4" />
                  </div>
                  <ChevronDownIcon className="hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <ReceiptIcon />
                      View Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <SettingsIcon />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircleIcon />
            </Button>

            <Button variant="ghost" size="icon" aria-label="Notifications">
              <BellIcon />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="bg-background sticky top-12 hidden h-[calc(100dvh-3rem)] w-64 shrink-0 border-r md:block">
          <div className="flex h-full flex-col gap-3 p-3">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href}
                />
              ))}
            </nav>

            <Separator />

            <div className="text-muted-foreground mt-auto text-[0.625rem] leading-relaxed">
              Tip: sidebar collapses on small screens; use the top bar to navigate.
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}


