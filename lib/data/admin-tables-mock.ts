export type AdminTableRecord = {
  /** Internal id for demo state management */
  id: string
  tableNumber: number
  tableType: string
  libraryFloor: number
  positionX: number
  positionY: number
  isReservable: boolean
  isAvailable: boolean
}

export const defaultAdminTables: AdminTableRecord[] = [
  {
    id: "tbl-001",
    tableNumber: 1,
    tableType: "SINGLE",
    libraryFloor: 1,
    positionX: 120,
    positionY: 90,
    isReservable: true,
    isAvailable: true,
  },
  {
    id: "tbl-002",
    tableNumber: 2,
    tableType: "DOUBLE",
    libraryFloor: 1,
    positionX: 220,
    positionY: 90,
    isReservable: true,
    isAvailable: false,
  },
  {
    id: "tbl-003",
    tableNumber: 12,
    tableType: "QUAD",
    libraryFloor: 2,
    positionX: 160,
    positionY: 190,
    isReservable: false,
    isAvailable: true,
  },
]

