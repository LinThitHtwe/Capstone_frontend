"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  Map,
  Monitor,
  Scale,
  UserCog,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const nav = [
  { href: "/admin", label: "Home", icon: Home, exact: true },
  { href: "/admin/tables", label: "Tables map", icon: Map, exact: false },
  { href: "/admin/weight-sensors", label: "Weight sensors", icon: Scale, exact: false },
  { href: "/admin/lcd-displays", label: "LCD displays", icon: Monitor, exact: false },
  {
    href: "/admin/reservations",
    label: "Reservation history",
    icon: History,
    exact: false,
  },
  { href: "/admin/students", label: "Students", icon: Users, exact: false },
  { href: "/admin/staff", label: "Staff", icon: UserCog, exact: false },
  {
    href: "/admin/lecturers",
    label: "Lecturers",
    icon: GraduationCap,
    exact: false,
  },
] as const

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  /** Desktop collapsed rail: icons only (still navigable). */
  collapsed?: boolean
  /** Called after navigating (e.g. close mobile drawer). */
  onNavigate?: () => void
}

export function AdminSidebarNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname()

  return (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b",
          collapsed
            ? "min-w-0 justify-center overflow-x-hidden px-2"
            : "gap-2 px-4"
        )}
      >
        <LayoutDashboard className="size-5 text-primary" aria-hidden />
        <span
          className={cn(
            "font-semibold tracking-tight",
            collapsed && "sr-only"
          )}
        >
          Admin
        </span>
      </div>
      <nav
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden",
          collapsed ? "items-center p-2" : "p-3"
        )}
        aria-label="Admin navigation"
      >
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed
                  ? "size-10 min-w-0 max-w-10 shrink-0 justify-center overflow-hidden p-0"
                  : "gap-2 px-3 py-2",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className={collapsed ? "sr-only" : undefined}>{label}</span>
            </Link>
          )
        })}
      </nav>
      <Separator
        className={cn(collapsed && "min-w-0 shrink-0")}
      />
      
    </>
  )
}
