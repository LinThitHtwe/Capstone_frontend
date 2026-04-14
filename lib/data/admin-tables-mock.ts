export type AdminTableRecord = {
  /** Internal id for demo state management */
  id: string
  tableNumber: number
  tableType: string
  libraryFloor: number
  positionX: number
  positionY: number
  isReservable: boolean
  /** Table row in service (false = off / maintenance on the map). */
  isAvailable: boolean
  /** Matches API ``Table.status``: 1=free, 2=occupied, 3=reserved. */
  status: number
  /**
   * From public API when a weight sensor is linked; null/undefined = unknown → demo seating.
   */
  sensorSeatedFromApi?: boolean | null
  /** Linked weight sensor (admin editor + API); null = none. */
  weightSensorId?: number | null
  /** Linked LCD display row (admin editor + API); null = none. */
  lcdDisplayId?: number | null
  /** From API when an LCD is linked (for labels). */
  lcdDisplayType?: string | null
}

const types = ["SINGLE", "CIRCULAR", "FOUR_SEATS"] as const

/** Irregular [x, y] pairs per floor — spaced to avoid overlap (tiles 72×52 on 900×520 map). */
const SCATTER_FLOOR_1: Array<[number, number]> = [
  [40, 45],
  [200, 38],
  [380, 62],
  [560, 44],
  [740, 58],
  [90, 160],
  [320, 140],
  [520, 175],
  [720, 155],
  [55, 300],
  [280, 285],
  [510, 320],
  [700, 295],
]

const SCATTER_FLOOR_2: Array<[number, number]> = [
  [30, 50],
  [175, 42],
  [340, 68],
  [500, 48],
  [680, 62],
  [765, 88],
  [85, 175],
  [290, 155],
  [480, 195],
  [640, 168],
  [800, 210],
  [120, 340],
  [380, 315],
  [600, 355],
]

function buildDefaultAdminTables(): AdminTableRecord[] {
  const out: AdminTableRecord[] = []
  let n = 1

  const pushFloor = (floor: 1 | 2, coords: Array<[number, number]>) => {
    coords.forEach(([positionX, positionY], i) => {
      out.push({
        id: `tbl-${String(n).padStart(3, "0")}`,
        tableNumber: n,
        tableType: types[(i + floor * 3) % 3],
        libraryFloor: floor,
        positionX,
        positionY,
        isReservable: (i + floor) % 4 !== 0,
        isAvailable: (i + floor + n) % 13 !== 0,
        status: 1,
        weightSensorId: null,
        lcdDisplayId: null,
      })
      n += 1
    })
  }

  pushFloor(1, SCATTER_FLOOR_1)
  pushFloor(2, SCATTER_FLOOR_2)

  return out
}

export const defaultAdminTables: AdminTableRecord[] = buildDefaultAdminTables()
