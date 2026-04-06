import {
  defaultAdminTables,
  type AdminTableRecord,
} from "@/lib/data/admin-tables-mock"

export type { AdminTableRecord }

/** Shared layout (localStorage). Bumped when default layout shape changes. */
export const LIBRARY_MAP_STORAGE_KEY = "admin-tables-layout-v3"

/** Dispatched after admin Save so the public map can refresh in the same tab. */
export const LIBRARY_MAP_UPDATE_EVENT = "library-map-updated"

export const libraryMapSize = { w: 900, h: 520 } as const
export const libraryTileSize = { w: 72, h: 52 } as const
export const libraryFloors = [1, 2] as const

export function tableTypeLabel(type: string): string {
  switch (type) {
    case "SINGLE":
      return "Single"
    case "CIRCULAR":
      return "Circular"
    case "FOUR_SEATS":
      return "4 seats"
    default:
      return type
  }
}

export function loadLibraryTablesFromLocalStorage(): AdminTableRecord[] {
  if (typeof window === "undefined") return defaultAdminTables
  try {
    const raw = localStorage.getItem(LIBRARY_MAP_STORAGE_KEY)
    if (!raw) return defaultAdminTables
    const parsed = JSON.parse(raw) as AdminTableRecord[]
    if (!Array.isArray(parsed)) return defaultAdminTables
    return parsed
  } catch {
    return defaultAdminTables
  }
}
