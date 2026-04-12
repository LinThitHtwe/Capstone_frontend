/**
 * When a table has no weight sensor yet, the map still shows a believable “seated” demo
 * so the overview matches the intended product behaviour until hardware is connected.
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
