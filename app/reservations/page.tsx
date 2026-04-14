import type { Metadata } from "next"
import { MyReservationsClient } from "@/components/reservations/my-reservations-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "My reservations",
  description: "Your reservation history",
}

export default function StudentReservationsPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background md:min-h-[calc(100vh-4rem)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My reservation history
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All reservations</CardTitle>
            <CardDescription>Newest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <MyReservationsClient />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
