import type { Metadata } from "next"

import { ReserveTableForm } from "@/components/reservations/reserve-table-form"

export const metadata: Metadata = {
  title: "Reserve a table",
  description: "Complete your library table reservation",
}

type PageProps = {
  searchParams: { table?: string }
}

function parseTableParam(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function ReserveTablePage({ searchParams }: PageProps) {
  const tableNumber = parseTableParam(searchParams.table)

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background md:min-h-[calc(100vh-4rem)]">
      <main className="mx-auto max-w-lg space-y-6 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reserve a table
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick a date and time in 30-minute slots (9:00–18:00, library time). Up
            to 4 hours per day per account.
          </p>
        </div>

        <ReserveTableForm initialTableNumber={tableNumber} />
      </main>
    </div>
  )
}
