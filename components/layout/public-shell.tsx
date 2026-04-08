"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { PublicSiteHeader } from "@/components/layout/public-site-header"

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showPublicChrome = !pathname?.startsWith("/admin")

  return (
    <>
      {showPublicChrome ? <PublicSiteHeader /> : null}
      {children}
    </>
  )
}
