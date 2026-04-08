import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "LCD displays",
  description: "Manage LCD displays",
}

export default function AdminLCDDisplaysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
