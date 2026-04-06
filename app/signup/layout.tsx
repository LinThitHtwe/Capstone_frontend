import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a library account",
}

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children
}
