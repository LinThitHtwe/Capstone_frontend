import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  description: "Administrative area",
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
