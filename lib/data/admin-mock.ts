export type StudentRecord = {
  id: string
  name: string
  email: string
  role: string
  idNumber: string
  dateJoined: string
  isActive: boolean
}

export type ReservationRecord = {
  id: string
  userName: string
  userEmail: string
  tableNumber: number
  startTime: string
  endTime: string
  durationMinutes: number
  otp: string
  createdAt: string
  isAvailable: boolean
}

/** Placeholder data until the backend is connected. */
export const mockStudents: StudentRecord[] = [
  {
    id: "stu-001",
    name: "Aisha Rahman",
    email: "aisha.r@student.edu",
    role: "student",
    idNumber: "INTI-2023-0001",
    dateJoined: "2026-02-10T08:15:00",
    isActive: true,
  },
  {
    id: "stu-002",
    name: "Marcus Chen",
    email: "marcus.c@student.edu",
    role: "student",
    idNumber: "INTI-2024-0042",
    dateJoined: "2026-03-01T11:05:00",
    isActive: true,
  },
  {
    id: "stu-003",
    name: "Sofia Martins",
    email: "sofia.m@student.edu",
    role: "student",
    idNumber: "INTI-2022-0120",
    dateJoined: "2026-01-22T15:30:00",
    isActive: true,
  },
  {
    id: "stu-004",
    name: "James Okafor",
    email: "james.o@student.edu",
    role: "student",
    idNumber: "INTI-2025-0008",
    dateJoined: "2026-03-20T09:00:00",
    isActive: false,
  },
  {
    id: "stf-001",
    name: "Nurul Izzah",
    email: "nurul.izzah@inti.edu.my",
    role: "staff",
    idNumber: "INTI-STF-0107",
    dateJoined: "2025-08-12T09:00:00",
    isActive: true,
  },
  {
    id: "stf-002",
    name: "Daniel Wong",
    email: "daniel.wong@inti.edu.my",
    role: "staff",
    idNumber: "INTI-STF-0148",
    dateJoined: "2024-11-05T10:30:00",
    isActive: true,
  },
  {
    id: "lec-001",
    name: "Dr. Priya Nair",
    email: "priya.nair@inti.edu.my",
    role: "lecturer",
    idNumber: "INTI-LEC-0023",
    dateJoined: "2022-03-18T08:45:00",
    isActive: true,
  },
  {
    id: "lec-002",
    name: "Mr. Amir Hakim",
    email: "amir.hakim@inti.edu.my",
    role: "lecturer",
    idNumber: "INTI-LEC-0041",
    dateJoined: "2023-01-09T09:15:00",
    isActive: false,
  },
]

export const mockReservations: ReservationRecord[] = [
  {
    id: "res-101",
    userName: "Aisha Rahman",
    userEmail: "aisha.r@student.edu",
    tableNumber: 12,
    startTime: "2026-04-02T09:00:00",
    endTime: "2026-04-02T11:00:00",
    durationMinutes: 120,
    otp: "482913",
    createdAt: "2026-04-02T08:59:20",
    isAvailable: true,
  },
  {
    id: "res-102",
    userName: "Marcus Chen",
    userEmail: "marcus.c@student.edu",
    tableNumber: 5,
    startTime: "2026-04-01T14:00:00",
    endTime: "2026-04-01T15:30:00",
    durationMinutes: 90,
    otp: "915204",
    createdAt: "2026-04-01T13:58:02",
    isAvailable: true,
  },
  {
    id: "res-103",
    userName: "Sofia Martins",
    userEmail: "sofia.m@student.edu",
    tableNumber: 20,
    startTime: "2026-04-03T10:00:00",
    endTime: "2026-04-03T16:00:00",
    durationMinutes: 360,
    otp: "113809",
    createdAt: "2026-04-03T09:59:41",
    isAvailable: true,
  },
  {
    id: "res-104",
    userName: "James Okafor",
    userEmail: "james.o@student.edu",
    tableNumber: 8,
    startTime: "2026-03-28T13:00:00",
    endTime: "2026-03-28T17:00:00",
    durationMinutes: 240,
    otp: "000000",
    createdAt: "2026-03-28T12:58:10",
    isAvailable: false,
  },
  {
    id: "res-105",
    userName: "Aisha Rahman",
    userEmail: "aisha.r@student.edu",
    tableNumber: 1,
    startTime: "2026-04-07T13:00:00",
    endTime: "2026-04-07T15:00:00",
    durationMinutes: 120,
    otp: "221100",
    createdAt: "2026-04-07T12:55:00",
    isAvailable: true,
  },
  {
    id: "res-106",
    userName: "Marcus Chen",
    userEmail: "marcus.c@student.edu",
    tableNumber: 12,
    startTime: "2026-04-07T18:00:00",
    endTime: "2026-04-07T19:30:00",
    durationMinutes: 90,
    otp: "334455",
    createdAt: "2026-04-07T09:00:00",
    isAvailable: true,
  },
]
