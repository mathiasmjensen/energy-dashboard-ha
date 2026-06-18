import type { PeakRateDay, PeakRateWindow } from '../../hooks/usePeakRates'
import type { SolarForecastWindow } from '../../hooks/useSolarForecast'

export const DAY_MS = 24 * 60 * 60 * 1000
export const FALLBACK_SOLAR_CURVE = [0, 0, 0, 0, 0.2, 0.8, 1.6, 3, 4.8, 6.5, 7.6, 8, 7.8, 7, 6, 4.5, 2.8, 1.3, 0.4, 0, 0, 0, 0, 0]
export const FALLBACK_PRICE_CURVE = [
  1.92, 1.84, 1.66, 1.47, 1.28, 1.13, 1.08, 1.16, 1.34, 1.58, 1.82, 2.24, 2.52, 2.68, 2.61, 2.42, 2.06,
  1.72, 1.52, 1.48, 1.42, 1.39, 1.44, 1.58,
]

export type InsightViewMode = 'timeline' | 'today'

export type InsightHeaderControls = {
  canGoNext: boolean
  canGoPrevious: boolean
  mode: InsightViewMode
  onNext: () => void
  onPrevious: () => void
  onToggleMode: () => void
}

export type InsightMetricItem = {
  label: string
  value: string
}

export type SolarForecastInsight = {
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  summaryItems: InsightMetricItem[]
  totalKwh: string
  windowLabel: string
}

export type EnergyPriceInsight = {
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  primaryValue: string
  summaryItems: InsightMetricItem[]
  windowLabel: string
}

export function createFallbackPriceDay(date: Date): PeakRateDay {
  const dateKey = formatLocalDateKey(date)
  const average = FALLBACK_PRICE_CURVE.reduce((sum, price) => sum + price, 0) / FALLBACK_PRICE_CURVE.length
  const peak = Math.max(...FALLBACK_PRICE_CURVE)

  return {
    average: average.toFixed(2),
    date: dateKey,
    label: 'Today',
    peak: peak.toFixed(2),
    prices: FALLBACK_PRICE_CURVE.map((price, hour) => ({
      date: dateKey,
      endIso: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1).toISOString(),
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      price,
      startIso: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).toISOString(),
    })),
  }
}

export function appendUnit(value: string, unit: string) {
  return value === '---' ? value : `${value}${unit}`
}

export function getSolarForecastInsight({
  fallbackValues,
  mode,
  now,
  offsetDays,
  source,
  windows,
}: {
  fallbackValues?: number[]
  mode: InsightViewMode
  now: Date
  offsetDays: number
  source: 'evcc' | 'open-meteo'
  windows: SolarForecastWindow[]
}): SolarForecastInsight {
  const { labels, startMs, values } = getSolarForecastBuckets(windows, now, mode, offsetDays, fallbackValues)
  const totalKwh = formatInsightNumber(values.reduce((sum, value) => sum + value, 0))
  const isTodayOverview = mode === 'today' && offsetDays === 0
  const isLiveTimeline = mode === 'timeline' && offsetDays === 0
  const activePowerWindow =
    windows.find((window) => {
      const start = Date.parse(window.time)
      const end = Date.parse(window.endTime)
      return start <= now.getTime() && now.getTime() < end
    }) ?? null
  const windowPeakKw = getSolarPeakKw(windows, startMs, startMs + DAY_MS)
  const summaryItems =
    isLiveTimeline
      ? [
          { label: 'Now', value: `${formatInsightNumber(activePowerWindow?.powerKw ?? 0)} kW` },
          { label: '24h peak', value: `${formatInsightNumber(windowPeakKw)} kW` },
        ]
      : isTodayOverview && source === 'evcc'
        ? [
            { label: 'Power', value: `${formatInsightNumber(activePowerWindow?.powerKw ?? 0)} kW` },
            { label: 'Day peak', value: `${formatInsightNumber(windowPeakKw)} kW` },
          ]
        : [{ label: mode === 'timeline' ? 'Window peak' : 'Day peak', value: `${formatInsightNumber(windowPeakKw)} kW` }]

  return {
    pointLabels: labels,
    points: values,
    primaryLabel: isLiveTimeline
      ? 'Forecast for the next 24 hours'
      : isTodayOverview && source === 'evcc'
        ? 'Remaining forecast'
        : mode === 'timeline'
          ? 'Forecast for this 24 hour window'
          : 'Forecast for selected day',
    summaryItems,
    totalKwh,
    windowLabel: formatInsightWindowLabel(now, mode, offsetDays),
  }
}

export function getEnergyPriceInsight({
  currentPrice,
  fallbackValues,
  mode,
  now,
  offsetDays,
  windows,
}: {
  currentPrice: string
  fallbackValues?: number[]
  mode: InsightViewMode
  now: Date
  offsetDays: number
  windows: PeakRateWindow[]
}): EnergyPriceInsight {
  const { labels, startMs, values } = getPeakRateBuckets(windows, now, mode, offsetDays, fallbackValues)
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  const peak = values.length ? Math.max(...values) : 0
  const low = values.length ? Math.min(...values) : 0
  const isTodayOverview = mode === 'today' && offsetDays === 0
  const isLiveTimeline = mode === 'timeline' && offsetDays === 0
  const requestedStartMs = getInsightWindowStartMs(now, mode, offsetDays)
  const isSelectedWindow = startMs === requestedStartMs

  return {
    pointLabels: labels,
    points: values,
    primaryLabel: isLiveTimeline
      ? 'Average for the next 24 hours'
      : isTodayOverview && isSelectedWindow
        ? 'Average price today'
        : mode === 'today'
          ? 'Average price for published day'
          : mode === 'timeline'
            ? 'Average for this 24 hour window'
            : 'Average price for selected day',
    primaryValue: formatInsightPrice(average),
    summaryItems: isLiveTimeline && isSelectedWindow
      ? [
          { label: 'Now', value: `${currentPrice} DKK` },
          { label: '24h peak', value: `${formatInsightPrice(peak)} DKK` },
        ]
      : isTodayOverview && isSelectedWindow
        ? [
            { label: 'Now', value: `${currentPrice} DKK` },
            { label: 'Day peak', value: `${formatInsightPrice(peak)} DKK` },
          ]
        : [
            { label: 'Low', value: `${formatInsightPrice(low)} DKK` },
            { label: 'Peak', value: `${formatInsightPrice(peak)} DKK` },
          ],
    windowLabel: formatInsightWindowLabelForStart(now, mode, startMs),
  }
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getSolarForecastBuckets(
  windows: SolarForecastWindow[],
  now: Date,
  mode: InsightViewMode,
  offsetDays: number,
  fallbackValues: number[] = [],
) {
  const startMs = getInsightWindowStartMs(now, mode, offsetDays)
  let values = Array.from({ length: 24 }, (_, index) => {
    const bucketStart = startMs + index * 3_600_000
    const bucketEnd = bucketStart + 3_600_000
    return Number(sumSolarOverlapKwh(windows, bucketStart, bucketEnd).toFixed(2))
  })

  if (!values.some((value) => value !== 0) && fallbackValues.length > 0) {
    values = normalizeFallbackBuckets(fallbackValues)
  }

  return {
    labels: Array.from({ length: 24 }, (_, index) => formatBucketLabel(startMs + index * 3_600_000, mode)),
    startMs,
    values,
  }
}

function getPeakRateBuckets(
  windows: PeakRateWindow[],
  now: Date,
  mode: InsightViewMode,
  offsetDays: number,
  fallbackValues: number[] = [],
) {
  const requestedStartMs = getInsightWindowStartMs(now, mode, offsetDays)
  let startMs = requestedStartMs
  let values = buildPeakRateBucketValues(windows, startMs)

  if (!values.some((value) => value !== 0) && windows.length > 0) {
    const fallbackStartMs = getFirstPublishedPeakRateStart(windows, requestedStartMs, mode)

    if (fallbackStartMs !== null) {
      startMs = fallbackStartMs
      values = buildPeakRateBucketValues(windows, startMs)
    }
  }

  if (!values.some((value) => value !== 0) && fallbackValues.length > 0) {
    values = normalizeFallbackBuckets(fallbackValues)
  }

  return {
    labels: Array.from({ length: 24 }, (_, index) => formatBucketLabel(startMs + index * 3_600_000, mode)),
    startMs,
    values,
  }
}

function normalizeFallbackBuckets(values: number[]) {
  const buckets = values.slice(0, 24)

  while (buckets.length < 24) {
    buckets.push(0)
  }

  return buckets.map((value) => Number(value.toFixed(2)))
}

function buildPeakRateBucketValues(windows: PeakRateWindow[], startMs: number) {
  return Array.from({ length: 24 }, (_, index) => {
    const bucketStart = startMs + index * 3_600_000
    const bucketEnd = bucketStart + 3_600_000
    const activeWindow = windows.find((window) => window.startMs < bucketEnd && window.endMs > bucketStart)
    return Number((activeWindow?.price ?? 0).toFixed(2))
  })
}

function getFirstPublishedPeakRateStart(windows: PeakRateWindow[], requestedStartMs: number, mode: InsightViewMode) {
  const firstWindow = windows.find((window) => window.endMs > requestedStartMs) ?? windows[0] ?? null

  if (!firstWindow) {
    return null
  }

  if (mode === 'today') {
    const localDate = new Date(firstWindow.startMs)
    return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()).getTime()
  }

  return firstWindow.startMs
}

function getInsightWindowStartMs(now: Date, mode: InsightViewMode, offsetDays: number) {
  if (mode === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return startOfDay.getTime() + offsetDays * DAY_MS
  }

  return now.getTime() + offsetDays * DAY_MS
}

function formatInsightWindowLabel(now: Date, mode: InsightViewMode, offsetDays: number) {
  return formatInsightWindowLabelForStart(now, mode, getInsightWindowStartMs(now, mode, offsetDays))
}

function formatInsightWindowLabelForStart(now: Date, mode: InsightViewMode, startMs: number) {
  if (mode === 'today') {
    const date = new Date(startMs)
    const dayDelta = Math.round((startMs - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / DAY_MS)
    const dateText = date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    })

    if (dayDelta === 0) {
      return `Today · ${dateText}`
    }

    if (dayDelta === -1) {
      return `Yesterday · ${dateText}`
    }

    if (dayDelta === 1) {
      return `Tomorrow · ${dateText}`
    }

    return dateText
  }

  const end = new Date(startMs + DAY_MS)
  return `${formatTimelineLabel(startMs)} -> ${formatTimelineLabel(end.getTime())}`
}

function formatBucketLabel(timestamp: number, mode: InsightViewMode) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: mode === 'timeline' ? '2-digit' : undefined,
  })
}

function formatTimelineLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  })
}

function sumSolarOverlapKwh(windows: SolarForecastWindow[], bucketStartMs: number, bucketEndMs: number) {
  return windows.reduce((sum, window) => {
    const startMs = Date.parse(window.time)
    const endMs = Date.parse(window.endTime)

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return sum
    }

    const overlapMs = Math.max(0, Math.min(bucketEndMs, endMs) - Math.max(bucketStartMs, startMs))

    if (overlapMs <= 0) {
      return sum
    }

    return sum + window.powerKw * (overlapMs / 3_600_000)
  }, 0)
}

function getSolarPeakKw(windows: SolarForecastWindow[], startMs: number, endMs: number) {
  return windows.reduce((max, window) => {
    const windowStartMs = Date.parse(window.time)
    const windowEndMs = Date.parse(window.endTime)

    if (windowEndMs <= startMs || windowStartMs >= endMs) {
      return max
    }

    return Math.max(max, window.powerKw)
  }, 0)
}

function formatInsightNumber(value: number) {
  return value.toFixed(1)
}

function formatInsightPrice(value: number) {
  return value.toFixed(2)
}
