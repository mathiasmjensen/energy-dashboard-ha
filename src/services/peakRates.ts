import type { PeakRateDay, PeakRateHour, PeakRateResult, PeakRateWindow } from '../models/peakRates'
import { resolveBrowserVisibleUrl } from './runtimeSecurity'

const LOOKAHEAD_MS = 24 * 60 * 60 * 1000

export function getPeakRateUrl() {
  const configured = getEnvValue('VITE_PEAK_RATE_URL')?.trim()

  if (configured?.toLowerCase() === 'disabled') {
    return ''
  }

  return configured ? resolveBrowserVisibleUrl(configured) : ''
}

function getEnvValue(key: string) {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key]
}

export function normalizePeakRates(payload: unknown) {
  const source = unwrapPeakRatePayload(payload)

  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map(normalizePeakRateWindow)
    .filter((window): window is PeakRateWindow => Boolean(window))
    .sort((left, right) => left.startMs - right.startMs)
}

export function getPeakRatePayloadFromAttributes(attributes: Record<string, unknown>, state?: string | null) {
  return getFirstArrayPayload([
    attributes.prices,
    attributes.windows,
    attributes.rates,
    attributes.data,
    attributes.items,
    state,
  ])
}

export function getPeakRateResult(windows: PeakRateWindow[], nowMs: number, error: boolean): PeakRateResult {
  const usableWindows = windows.filter((window) => window.endMs > nowMs)
  const activeWindow =
    windows.find((window) => window.startMs <= nowMs && nowMs < window.endMs) ?? usableWindows[0] ?? null
  const lookaheadEndMs = nowMs + LOOKAHEAD_MS
  const peakWindow =
    usableWindows
      .filter((window) => window.startMs <= lookaheadEndMs)
      .reduce<PeakRateWindow | null>((peak, window) => {
        if (!peak || window.price > peak.price) {
          return window
        }

        return peak
      }, null) ?? activeWindow
  const lookaheadWindows = usableWindows.filter((window) => window.startMs <= lookaheadEndMs)
  const average =
    lookaheadWindows.length > 0
      ? lookaheadWindows.reduce((sum, window) => sum + window.price, 0) / lookaheadWindows.length
      : null

  return {
    average: average === null ? null : formatPrice(average),
    days: getPeakRateDays(windows, nowMs),
    error,
    hourlyPrices: lookaheadWindows.slice(0, 24).map((window) => window.price),
    isStale: false,
    now: activeWindow ? formatPrice(activeWindow.price) : null,
    peak: peakWindow ? formatPrice(peakWindow.price) : null,
    peakLabel: formatWindowLabel(peakWindow),
    source: 'remote',
    windows,
  }
}

function getNumericPrice(value: unknown) {
  const price = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(price) ? price : null
}

function unwrapPeakRatePayload(payload: unknown): unknown {
  if (typeof payload === 'string') {
    try {
      return unwrapPeakRatePayload(JSON.parse(payload))
    } catch {
      return payload
    }
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>
    return getFirstArrayPayload([record.prices, record.windows, record.rates, record.data, record.items]) ?? payload
  }

  return payload
}

function getFirstArrayPayload(values: unknown[]) {
  for (const value of values) {
    const parsedValue = typeof value === 'string' ? parseJson(value) : value

    if (Array.isArray(parsedValue)) {
      return parsedValue
    }

    if (parsedValue && typeof parsedValue === 'object') {
      const nested = unwrapPeakRatePayload(parsedValue)

      if (Array.isArray(nested)) {
        return nested
      }
    }
  }

  return null
}

function parseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizePriceToDkk(price: number) {
  return Math.abs(price) >= 20 ? price / 100 : price
}

function normalizePeakRateWindow(value: unknown): PeakRateWindow | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const row = value as Record<string, unknown>
  const startMs = Date.parse(String(row.start))
  const endMs = Date.parse(String(row.end))
  const price = getNumericPrice(row.price)

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs || price === null) {
    return null
  }

  return { endMs, price: normalizePriceToDkk(price), startMs }
}

function formatPrice(price: number) {
  return price.toFixed(2)
}

function formatDateKey(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDayLabel(dateKey: string, nowMs: number) {
  const todayKey = formatDateKey(nowMs)
  const tomorrowKey = formatDateKey(nowMs + LOOKAHEAD_MS)

  if (dateKey === todayKey) {
    return 'Today'
  }

  if (dateKey === tomorrowKey) {
    return 'Tomorrow'
  }

  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  })
}

function formatClock(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

function formatWindowLabel(window: PeakRateWindow | null) {
  if (!window) {
    return 'Next Peak'
  }

  return `${formatClock(window.startMs)} - ${formatClock(window.endMs)}`
}

function getPeakRateDays(windows: PeakRateWindow[], nowMs: number): PeakRateDay[] {
  const grouped = windows.reduce<Map<string, PeakRateWindow[]>>((groups, window) => {
    const dateKey = formatDateKey(window.startMs)
    const dayWindows = groups.get(dateKey) ?? []
    dayWindows.push(window)
    groups.set(dateKey, dayWindows)
    return groups
  }, new Map())

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayWindows]) => {
      const prices = dayWindows
        .sort((left, right) => left.startMs - right.startMs)
        .map<PeakRateHour>((window) => ({
          date,
          endIso: new Date(window.endMs).toISOString(),
          hour: new Date(window.startMs).getHours(),
          label: formatClock(window.startMs),
          price: window.price,
          startIso: new Date(window.startMs).toISOString(),
        }))
      const average = prices.length > 0 ? prices.reduce((sum, window) => sum + window.price, 0) / prices.length : null
      const peak = prices.length > 0 ? Math.max(...prices.map((window) => window.price)) : null

      return {
        average: average === null ? null : formatPrice(average),
        date,
        label: formatDayLabel(date, nowMs),
        peak: peak === null ? null : formatPrice(peak),
        prices,
      }
    })
}
