"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Calendar, LogIn, LogOut, UserPlus } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatRoleLabel } from "@/lib/auth-config"

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export function PublicSiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { hydrated, isAuthenticated, isAdmin, email, role, logout } = useAuth()
  const publicRoleLabel = !isAdmin ? formatRoleLabel(role) : null

  if (pathname?.startsWith("/admin")) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:h-16 md:gap-6 md:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <BookOpen className="size-6 shrink-0 text-primary" aria-hidden />
          <span className="hidden sm:inline">Capstone Library</span>
          <span className="sm:hidden">Library</span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-1 md:flex"
          aria-label="Main"
        >
          <NavLink href="/">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5 opacity-70" aria-hidden />
              Map
            </span>
          </NavLink>
          <NavLink href="/reservations">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 opacity-70" aria-hidden />
              Reservations
            </span>
          </NavLink>
        </nav>

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <nav
            className="flex items-center gap-1 border-r border-border pr-2 md:hidden"
            aria-label="Mobile sections"
          >
            <NavLink href="/">Map</NavLink>
            <NavLink href="/reservations">Res.</NavLink>
          </nav>

          {!hydrated ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
          ) : isAuthenticated ? (
            <>
              <span
                className="hidden max-w-[10rem] truncate text-xs text-muted-foreground sm:inline md:max-w-[14rem]"
                title={email ?? undefined}
              >
                {email}
              </span>
              {publicRoleLabel ? (
                <span
                  className="hidden rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground sm:inline"
                  title={`Signed in as ${publicRoleLabel}`}
                >
                  {publicRoleLabel}
                </span>
              ) : null}
              {isAdmin ? (
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={handleLogout}
              >
                <LogOut className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                <Link href="/login">
                  <LogIn className="size-3.5" aria-hidden />
                  Log in
                </Link>
              </Button>
              <Button asChild size="sm" className="shrink-0 gap-1.5">
                <Link href="/signup">
                  <UserPlus className="size-3.5" aria-hidden />
                  Sign up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
