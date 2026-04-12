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

/**
 * Public map: cap strip width to the artboard (see `libraryMapSize.w`); keep Tailwind
 * `900px` here in sync when the artboard width changes.
 */
export const LIBRARY_MAP_PUBLIC_VIEWPORT_WRAP_CLASSNAME =
  "mx-auto w-full min-w-0 max-w-[min(100%,900px)]"

/**
 * Admin preview (single main column): width as if the sidebar were always expanded
 * (15rem) plus shell padding, so toggling collapse does not resize the map.
 */
export const LIBRARY_MAP_ADMIN_HOME_VIEWPORT_WRAP_CLASSNAME =
  "mx-auto w-full min-w-0 max-w-full lg:max-w-[min(100%,calc(100dvw-15rem-5.5rem))]"

/**
 * Admin tables editor (map + details rail): same idea, including the details column (~16rem).
 */
export const LIBRARY_MAP_ADMIN_TABLES_VIEWPORT_WRAP_CLASSNAME =
  "mx-auto w-full min-w-0 max-w-full lg:max-w-[min(100%,calc(100dvw-15rem-16rem-6rem))]"

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
