/**
 * When a table has no linked weight sensor, seating is simulated so the map still
 * shows occupied vs free patterns for tables without hardware.
 */
export function resolveSensorSeated(
  fromApi: boolean | null | undefined,
  tableNumber: number,
  libraryFloor: number,
  nowMs: number
): boolean {
  if (fromApi === true || fromApi === false) return fromApi
  const seed = tableNumber * 31 + libraryFloor * 17
  const phase = Math.floor(nowMs / 90_000)
  return (seed + phase) % 4 === 0
}
