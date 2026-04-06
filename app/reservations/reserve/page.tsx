import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">← Library map</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/reservations">My reservations</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reserve a table
          </h1>
          <p className="text-sm text-muted-foreground">
            Confirm details and submit your booking (demo — form coming soon).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>
              Selected from the map. Adjust the URL query{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                ?table=
              </code>{" "}
              if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tableNumber == null ? (
              <p className="text-sm text-muted-foreground">
                No table was selected. Open the{" "}
                <Link href="/" className="font-medium text-foreground underline">
                  library map
                </Link>
                , click a free (green) table, and confirm in the dialog.
              </p>
            ) : (
              <>
                <p className="text-lg">
                  You are reserving{" "}
                  <span className="font-semibold tabular-nums">
                    table no. {tableNumber}
                  </span>
                  .
                </p>
                <p className="text-sm text-muted-foreground">
                  Date, time, and confirmation will be added here when the
                  booking API is wired up.
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" disabled>
                Submit reservation
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to map</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
