import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your library account",
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
