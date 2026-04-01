"use client"

import * as React from "react"
import { PanelLeft, PanelLeftClose } from "lucide-react"

import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "admin-sidebar-open"

function isMobileViewport() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(max-width: 767px)").matches
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  const [hydrated, setHydrated] = React.useState(false)

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

  return (
    <div className="flex min-h-screen w-full bg-background">
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
        aria-hidden={!open}
        className={cn(
          "flex min-w-0 shrink-0 flex-col border-r bg-muted/30 transition-[transform,width,border-color] duration-200 ease-out",
          "fixed left-0 top-0 z-50 h-full w-60 md:relative md:z-auto md:h-auto",
          open
            ? "translate-x-0 md:w-60"
            : "-translate-x-full pointer-events-none md:pointer-events-auto md:translate-x-0 md:w-0 md:overflow-hidden md:border-transparent"
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
        <AdminSidebarNav onNavigate={afterNav} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
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
          <span className="text-sm font-medium text-muted-foreground">
            Admin
          </span>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
