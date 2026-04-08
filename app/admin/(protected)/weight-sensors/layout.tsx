import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Weight sensors",
  description: "Manage library weight sensors",
}

export default function AdminWeightSensorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
