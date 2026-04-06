import { mockReservations, type ReservationRecord } from "@/lib/data/admin-mock"

/** Demo “logged-in” student until auth is wired. */
export const DEMO_STUDENT_EMAIL = "aisha.r@student.edu"

export function getDemoStudentReservations(): ReservationRecord[] {
  return mockReservations.filter((r) => r.userEmail === DEMO_STUDENT_EMAIL)
}

export function getDemoStudentReservationsSorted(): ReservationRecord[] {
  return [...getDemoStudentReservations()].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )
}
