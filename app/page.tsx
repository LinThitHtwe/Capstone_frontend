import type { Metadata } from "next"

import { PublicLibraryMap } from "@/components/library/public-library-map"

export const metadata: Metadata = {
  title: "Home",
  description: "Library table map",
}

export default function HomePage() {
  return <PublicLibraryMap />
}
