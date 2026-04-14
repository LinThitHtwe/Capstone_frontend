/** Must match backend ``api.constants.LIBRARY_RESERVATION_TZ``. */
export const LIBRARY_TIMEZONE = "Asia/Kuala_Lumpur"

export const RESERVATION_SLOT_MINUTES = 30
export const RESERVATION_MAX_MINUTES_PER_DAY = 240
const OPEN_MIN = 9 * 60
const CLOSE_MIN = 18 * 60

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

export function minutesToHhmm(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${pad2(h)}:${pad2(m)}`
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => Number.parseInt(x, 10))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN
  return h * 60 + m
}

/** Start times 09:00 … 17:30 (library local). */
export function startSlotOptions(): string[] {
  const out: string[] = []
  for (let m = OPEN_MIN; m < CLOSE_MIN; m += RESERVATION_SLOT_MINUTES) {
    out.push(minutesToHhmm(m))
  }
  return out
}

/** End times 09:30 … 18:00 (library local). */
export function endSlotOptions(): string[] {
  const out: string[] = []
  for (let m = OPEN_MIN + RESERVATION_SLOT_MINUTES; m <= CLOSE_MIN; m += RESERVATION_SLOT_MINUTES) {
    out.push(minutesToHhmm(m))
  }
  return out
}

export function endsAfterStart(startHhmm: string): string[] {
  const s = hhmmToMinutes(startHhmm)
  if (!Number.isFinite(s)) return endSlotOptions()
  return endSlotOptions().filter((e) => hhmmToMinutes(e) > s)
}

/** Calendar YYYY-MM-DD in the library zone for an instant. */
export function libraryYmdFromInstant(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: LIBRARY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/** Library calendar date for a reservation row's ``start_time`` (ISO from API). */
export function libraryYmdFromReservationStart(iso: string): string {
  return libraryYmdFromInstant(new Date(iso))
}

export function durationMinutes(startHhmm: string, endHhmm: string): number {
  return hhmmToMinutes(endHhmm) - hhmmToMinutes(startHhmm)
}

export function libraryMinutesSinceMidnight(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LIBRARY_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0")
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0")
  return h * 60 + m
}

/** First plausible start on ``ymd`` (library calendar), aligned to 30 minutes. */
export function suggestedStartForDate(ymd: string): string {
  const today = libraryYmdFromInstant()
  if (ymd > today) return "09:00"
  if (ymd < today) return "09:00"
  const mins = libraryMinutesSinceMidnight()
  if (mins >= CLOSE_MIN) return minutesToHhmm(CLOSE_MIN - RESERVATION_SLOT_MINUTES)
  if (mins < OPEN_MIN) return "09:00"
  const rounded = Math.ceil(mins / RESERVATION_SLOT_MINUTES) * RESERVATION_SLOT_MINUTES
  const c = Math.max(rounded, OPEN_MIN)
  const lastStart = CLOSE_MIN - RESERVATION_SLOT_MINUTES
  return minutesToHhmm(Math.min(c, lastStart))
}

export function suggestedEndAfterStart(startHhmm: string): string {
  const s = hhmmToMinutes(startHhmm)
  const e = s + RESERVATION_SLOT_MINUTES
  if (e > CLOSE_MIN) return minutesToHhmm(CLOSE_MIN)
  return minutesToHhmm(e)
}
