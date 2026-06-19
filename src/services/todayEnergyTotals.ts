const CACHE_KEY_PREFIX = 'energy-dashboard:today-energy-totals:'

export type HistoryRow = {
  attributes?: {
    unit_of_measurement?: string
  }
  entity_id?: string
  last_changed: string
  state: string
}

export type TodayEnergyTotals = {
  evKwh: string
  gridKwh: string
  homeKwh: string
}

type TodayEnergyTotalsCache = {
  createdAt: number
  totals: TodayEnergyTotals
}

export function getInitialTodayEnergyTotals() {
  const cache = readTodayEnergyTotalsCache(new Date())

  return cache?.totals ?? getEmptyTodayEnergyTotals()
}

export function getEmptyTodayEnergyTotals(): TodayEnergyTotals {
  return {
    evKwh: '---',
    gridKwh: '---',
    homeKwh: '---',
  }
}

export function readTodayEnergyTotalsCache(date: Date) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(date))
    const parsed = raw ? (JSON.parse(raw) as TodayEnergyTotalsCache) : null
    return parsed?.totals ? parsed : null
  } catch {
    return null
  }
}

export function writeTodayEnergyTotalsCache(date: Date, totals: TodayEnergyTotals) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getCacheKey(date),
      JSON.stringify({
        createdAt: Date.now(),
        totals,
      } satisfies TodayEnergyTotalsCache),
    )
  } catch {
    // localStorage can be unavailable in hardened browsers.
  }
}

export function integrateHistorySeries(rows: HistoryRow[], nowMs: number, clamp: (value: number) => number) {
  if (!rows.length) {
    return 0
  }

  const unit = rows[0]?.attributes?.unit_of_measurement ?? ''
  const scale = unit === 'W' ? 0.001 : 1
  let sumKwh = 0

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const startMs = Date.parse(row.last_changed)
    const endMs = index + 1 < rows.length ? Date.parse(rows[index + 1].last_changed) : nowMs
    const durationHours = Math.max(0, endMs - startMs) / 3_600_000
    const value = parseNumber(row.state)

    if (value === null || durationHours <= 0) {
      continue
    }

    sumKwh += clamp(value * scale) * durationHours
  }

  return sumKwh
}

export function formatKwh(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '---'
}

export function getMidnightIso(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

function getCacheKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${CACHE_KEY_PREFIX}${year}-${month}-${day}`
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}
