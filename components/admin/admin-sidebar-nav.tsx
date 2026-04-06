"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  Map,
  UserCog,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const nav = [
  { href: "/admin", label: "Home", icon: Home, exact: true },
  { href: "/admin/students", label: "Students", icon: Users, exact: false },
  { href: "/admin/staff", label: "Staff", icon: UserCog, exact: false },
  {
    href: "/admin/lecturers",
    label: "Lecturers",
    icon: GraduationCap,
    exact: false,
  },
  { href: "/admin/tables", label: "Tables map", icon: Map, exact: false },
  {
    href: "/admin/reservations",
    label: "Reservation history",
    icon: History,
    exact: false,
  },
] as const

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  /** Called after navigating (e.g. close mobile drawer). */
  onNavigate?: () => void
}

export function AdminSidebarNav({ onNavigate }: Props) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <LayoutDashboard className="size-5 text-primary" aria-hidden />
        <span className="font-semibold tracking-tight">Admin</span>
      </div>
      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
        aria-label="Admin navigation"
      >
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>
      <Separator />
      
    </>
  )
}
