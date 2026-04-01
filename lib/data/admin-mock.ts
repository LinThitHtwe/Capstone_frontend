export type StudentRecord = {
  id: string
  name: string
  email: string
  program: string
  yearLevel: string
}

export type ReservationRecord = {
  id: string
  studentName: string
  resource: string
  startAt: string
  endAt: string
  status: "confirmed" | "completed" | "cancelled"
}

/** Placeholder data until the backend is connected. */
export const mockStudents: StudentRecord[] = [
  {
    id: "stu-001",
    name: "Aisha Rahman",
    email: "aisha.r@student.edu",
    program: "Computer Science",
    yearLevel: "3",
  },
  {
    id: "stu-002",
    name: "Marcus Chen",
    email: "marcus.c@student.edu",
    program: "Information Systems",
    yearLevel: "2",
  },
  {
    id: "stu-003",
    name: "Sofia Martins",
    email: "sofia.m@student.edu",
    program: "Software Engineering",
    yearLevel: "4",
  },
  {
    id: "stu-004",
    name: "James Okafor",
    email: "james.o@student.edu",
    program: "Computer Science",
    yearLevel: "1",
  },
]

export const mockReservations: ReservationRecord[] = [
  {
    id: "res-101",
    studentName: "Aisha Rahman",
    resource: "Lab A — Workstation 12",
    startAt: "2026-04-02T09:00:00",
    endAt: "2026-04-02T11:00:00",
    status: "confirmed",
  },
  {
    id: "res-102",
    studentName: "Marcus Chen",
    resource: "Meeting Room 3",
    startAt: "2026-04-01T14:00:00",
    endAt: "2026-04-01T15:30:00",
    status: "completed",
  },
  {
    id: "res-103",
    studentName: "Sofia Martins",
    resource: "Project Pod B",
    startAt: "2026-04-03T10:00:00",
    endAt: "2026-04-03T16:00:00",
    status: "confirmed",
  },
  {
    id: "res-104",
    studentName: "James Okafor",
    resource: "Lab A — Workstation 5",
    startAt: "2026-03-28T13:00:00",
    endAt: "2026-03-28T17:00:00",
    status: "cancelled",
  },
]
