"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, PanelLeft, PanelLeftClose } from "lucide-react"

import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "admin-sidebar-open"

function isMobileViewport() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(max-width: 767px)").matches
}

/** Default `true` avoids one frame where the sidebar is narrow but nav still shows full labels (desktop). */
function useMediaQuery(query: string, defaultValue = false) {
  const [matches, setMatches] = React.useState(defaultValue)

  React.useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setMatches(mq.matches)
    fn()
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [query])

  return matches
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { logout, email } = useAuth()
  const [open, setOpen] = React.useState(true)
  const [hydrated, setHydrated] = React.useState(false)
  const isMdUp = useMediaQuery("(min-width: 768px)", true)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setOpen(stored === "1")
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, open ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [open, hydrated])

  const afterNav = React.useCallback(() => {
    if (isMobileViewport()) setOpen(false)
  }, [])

  const handleLogout = React.useCallback(() => {
    logout()
    router.replace("/login")
  }, [logout, router])

  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background">
      <button
        type="button"
        aria-label="Close sidebar"
        tabIndex={open ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        id="admin-sidebar"
        aria-hidden={!open && !isMdUp}
        className={cn(
          "flex min-w-0 shrink-0 flex-col border-r bg-muted/30 transition-[transform,width] duration-200 ease-out",
          "fixed left-0 top-0 z-50 h-full w-60 overflow-x-hidden md:sticky md:top-0 md:z-auto md:h-screen md:min-h-0 md:self-start md:overflow-hidden",
          open
            ? "translate-x-0 md:w-60"
            : "-translate-x-full pointer-events-none md:pointer-events-auto md:translate-x-0 md:w-14"
        )}
      >
        <div className="flex items-center justify-end border-b px-2 py-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
        <AdminSidebarNav
          collapsed={!open && isMdUp}
          onNavigate={afterNav}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
          </Button>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
            Admin
            {email ? (
              <span className="ml-2 hidden text-xs font-normal text-muted-foreground/80 sm:inline">
                ({email})
              </span>
            ) : null}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" aria-hidden />
            Log out
          </Button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
