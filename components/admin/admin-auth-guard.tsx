"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, isAdmin } = useAuth()

  React.useEffect(() => {
    if (!hydrated) return
    if (isAdmin) return
    const from = `?from=${encodeURIComponent(pathname)}`
    router.replace(`/login${from}`)
  }, [hydrated, isAdmin, pathname, router])

  if (!hydrated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking access…
      </div>
    )
  }

  return <>{children}</>
}
