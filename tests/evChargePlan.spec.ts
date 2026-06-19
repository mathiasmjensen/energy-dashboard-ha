import { expect, test } from '@playwright/test'
import {
  createRollingPriceDay,
  createRollingPriceHours,
  formatLocalDateKey,
  formatPlanRangeLabel,
  getNextFullHourMs,
  normalizeClockValue,
  resolvePlanRange,
} from '../src/services/evChargePlan'
import type { PeakRateDay } from '../src/hooks/usePeakRates'

function makePriceDay(date: Date, prices: number[]): PeakRateDay {
  const dateKey = formatLocalDateKey(date)

  return {
    average: null,
    date: dateKey,
    label: 'Test day',
    peak: null,
    prices: prices.map((price, hour) => {
      const start = new Date(date)
      start.setHours(hour, 0, 0, 0)
      const end = new Date(start)
      end.setHours(start.getHours() + 1)

      return {
        date: dateKey,
        endIso: end.toISOString(),
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        price,
        startIso: start.toISOString(),
      }
    }),
  }
}

test.describe('EV charge plan service', () => {
  test('moves a same-day start time into the future when today has already passed it', () => {
    const earliestStartMs = getNextFullHourMs(new Date(2026, 5, 12, 22, 15).getTime())
    const range = resolvePlanRange('21:00', '23:00', earliestStartMs)

    expect(new Date(range.startMs).getDate()).toBe(13)
    expect(new Date(range.startMs).getHours()).toBe(21)
    expect(new Date(range.endMs).getDate()).toBe(13)
    expect(new Date(range.endMs).getHours()).toBe(23)
  })

  test('allows a charging window that crosses midnight', () => {
    const earliestStartMs = getNextFullHourMs(new Date(2026, 5, 12, 20, 10).getTime())
    const range = resolvePlanRange('23:00', '03:00', earliestStartMs)

    expect(new Date(range.startMs).getDate()).toBe(12)
    expect(new Date(range.startMs).getHours()).toBe(23)
    expect(new Date(range.endMs).getDate()).toBe(13)
    expect(new Date(range.endMs).getHours()).toBe(3)
    expect(formatPlanRangeLabel(range.startMs, range.endMs)).toContain('next day')
  })

  test('creates a rolling 24 hour price day from cache-backed price windows', () => {
    const today = new Date(2026, 5, 12)
    const tomorrow = new Date(2026, 5, 13)
    const priceDays = [
      makePriceDay(today, Array.from({ length: 24 }, (_, hour) => hour / 10)),
      makePriceDay(tomorrow, Array.from({ length: 24 }, (_, hour) => 3 + hour / 10)),
    ]
    const startMs = new Date(2026, 5, 12, 23).getTime()
    const hours = createRollingPriceHours(priceDays, [], startMs)
    const day = createRollingPriceDay(hours)

    expect(hours).toHaveLength(24)
    expect(hours[0].price).toBe(2.3)
    expect(hours[1].price).toBe(3)
    expect(day.prices).toHaveLength(24)
    expect(day.label).toBe('Next 24 hours')
  })

  test('normalizes HA clock values without leaking invalid values into inputs', () => {
    expect(normalizeClockValue('06:30:00', '22:00')).toBe('06:30')
    expect(normalizeClockValue('unknown', '22:00')).toBe('22:00')
  })
})
