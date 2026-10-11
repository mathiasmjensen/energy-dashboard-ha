import type { EvPlanPriceHour } from '../models/evChargePlan'
import type { PeakRateDay, PeakRateHour } from '../models/peakRates'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getNextFullHourMs(timestamp: number) {
  const date = new Date(timestamp)
  date.setMinutes(0, 0, 0)

  if (date.getTime() <= timestamp) {
    date.setHours(date.getHours() + 1)
  }

  return date.getTime()
}

export function getCurrentHourMs(timestamp: number) {
  const date = new Date(timestamp)
  date.setMinutes(0, 0, 0)

  return date.getTime()
}

/**
 * Home Assistant time triggers are precise to the minute. Leave one complete
 * minute for the helper update to arrive before scheduling a current-hour plan.
 */
export function getNextSafePlanStartMs(timestamp: number) {
  const date = new Date(timestamp)
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)

  return date.getTime()
}

export function isClockValue(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/)

  if (!match) {
    return false
  }

  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

export function resolvePlanEndAfterStart(value: string, startMs: number) {
  let endMs = setDateClock(startMs, value)

  while (endMs <= startMs) {
    endMs += DAY_MS
  }

  return endMs
}

export function resolvePlanRange(from: string, to: string, earliestStartMs: number) {
  const startMs = resolveFutureStartMs(from, earliestStartMs)
  const endMs = resolvePlanEndAfterStart(to, startMs)

  return { endMs, startMs }
}

/**
 * An active plan already has a valid start timestamp in Home Assistant. Keep
 * it intact when re-enabling the timer so the reconciliation automation can
 * begin charging immediately instead of moving the start into the future.
 */
export function isPlanWindowActive(startMs: number, endMs: number, nowMs: number) {
  return startMs <= nowMs && nowMs < endMs
}

export function formatClock(timestamp: number) {
  const date = new Date(timestamp)

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatClockWithSeconds(timestamp: number) {
  const date = new Date(timestamp)

  return `${formatClock(timestamp)}:${String(date.getSeconds()).padStart(2, '0')}`
}

/** Returns the final second inside an hourly price slot. */
export function getInclusivePriceHourEndMs(endMs: number) {
  return endMs - 1_000
}

export function formatPlanRangeLabel(startMs: number, endMs: number) {
  const startDate = formatLocalDateKey(new Date(startMs))
  const endDate = formatLocalDateKey(new Date(endMs))
  const timeLabel = `${formatClock(startMs)} - ${formatClock(endMs)}`

  return startDate === endDate ? timeLabel : `${timeLabel} next day`
}

export function createRollingPriceHours(
  priceDays: PeakRateDay[],
  fallbackPrices: number[],
  startMs: number,
): EvPlanPriceHour[] {
  const sourcePrices = getAllPriceHours(priceDays)

  return Array.from({ length: 24 }, (_, index) => {
    const bucketStartMs = startMs + index * HOUR_MS
    const bucketEndMs = bucketStartMs + HOUR_MS
    const sourcePrice = sourcePrices.find((price) => price.startMs <= bucketStartMs && bucketStartMs < price.endMs)
    const bucketDate = formatLocalDateKey(new Date(bucketStartMs))
    const bucketHour = new Date(bucketStartMs).getHours()
    const fallbackPrice = fallbackPrices[bucketHour % Math.max(1, fallbackPrices.length)] ?? 0

    return {
      date: bucketDate,
      disabled: bucketStartMs < startMs,
      endIso: new Date(bucketEndMs).toISOString(),
      endMs: bucketEndMs,
      hour: bucketHour,
      index,
      label: formatClock(bucketStartMs),
      price: sourcePrice?.price ?? fallbackPrice,
      startIso: new Date(bucketStartMs).toISOString(),
      startMs: bucketStartMs,
    }
  })
}

export function createRollingPriceDay(priceHours: EvPlanPriceHour[]): PeakRateDay {
  const prices = priceHours.filter((price) => !price.disabled)
  const average = prices.length ? prices.reduce((sum, price) => sum + price.price, 0) / prices.length : null
  const peak = prices.length ? Math.max(...prices.map((price) => price.price)) : null
  const firstStartMs = prices[0]?.startMs ?? Date.now()
  const lastEndMs = prices[prices.length - 1]?.endMs ?? firstStartMs + DAY_MS

  return {
    average: average === null ? null : average.toFixed(2),
    date: `${formatShortDate(firstStartMs)} - ${formatShortDate(lastEndMs)}`,
    label: 'Next 24 hours',
    peak: peak === null ? null : peak.toFixed(2),
    prices,
  }
}

export function normalizeClockValue(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  const clock = value.match(/^(\d{2}:\d{2})(?::\d{2})?$/)?.[1]

  return clock && isClockValue(clock) ? clock : fallback
}

function getClockParts(value: string) {
  const [hourValue, minuteValue] = value.split(':')
  const hour = Number.parseInt(hourValue, 10)
  const minute = Number.parseInt(minuteValue, 10)

  return {
    hour: Number.isInteger(hour) ? Math.min(23, Math.max(0, hour)) : 0,
    minute: Number.isInteger(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  }
}

function setDateClock(baseMs: number, value: string) {
  const { hour, minute } = getClockParts(value)
  const date = new Date(baseMs)
  date.setHours(hour, minute, 0, 0)

  return date.getTime()
}

function resolveFutureStartMs(value: string, earliestStartMs: number) {
  let startMs = setDateClock(earliestStartMs, value)

  while (startMs < earliestStartMs) {
    startMs += DAY_MS
  }

  return startMs
}

function formatShortDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
  })
}

function getPriceWindowStartMs(price: PeakRateHour) {
  const isoMs = Date.parse(price.startIso)

  if (Number.isFinite(isoMs)) {
    return isoMs
  }

  const [year, month, day] = price.date.split('-').map(Number)
  return new Date(year, month - 1, day, price.hour, 0, 0, 0).getTime()
}

function getPriceWindowEndMs(price: PeakRateHour, startMs: number) {
  const isoMs = Date.parse(price.endIso)

  if (Number.isFinite(isoMs) && isoMs > startMs) {
    return isoMs
  }

  return startMs + HOUR_MS
}

function getAllPriceHours(priceDays: PeakRateDay[]) {
  return priceDays
    .flatMap((day) => day.prices)
    .map((price) => {
      const startMs = getPriceWindowStartMs(price)
      const endMs = getPriceWindowEndMs(price, startMs)

      return { ...price, endMs, startMs }
    })
    .sort((left, right) => left.startMs - right.startMs)
}
