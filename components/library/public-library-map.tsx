"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { HomeReservationHistoryPreview } from "@/components/library/home-reservation-history-preview"
import { LibraryMapExperienceCard } from "@/components/library/library-map-experience-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PublicLibraryMap() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background md:min-h-[calc(100vh-4rem)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library map</h1>
          <p className="text-sm text-muted-foreground">Tables by floor.</p>
        </div>
        <LibraryMapExperienceCard variant="public" />

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Your reservation history</CardTitle>
              <CardDescription>Newest three.</CardDescription>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/reservations">
                Full reservation history
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <HomeReservationHistoryPreview />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
