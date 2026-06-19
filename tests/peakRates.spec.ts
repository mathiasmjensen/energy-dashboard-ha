import { expect, test } from '@playwright/test'
import { getPeakRateResult, normalizePeakRates } from '../src/services/peakRates'

test.describe('peak rates service', () => {
  test('normalizes upstream price windows to DKK and sorts by start time', () => {
    const windows = normalizePeakRates([
      {
        end: '2026-06-12T12:00:00+02:00',
        price: 85,
        start: '2026-06-12T11:00:00+02:00',
      },
      {
        end: '2026-06-12T11:00:00+02:00',
        price: '1,25',
        start: '2026-06-12T10:00:00+02:00',
      },
    ])

    expect(windows).toHaveLength(2)
    expect(windows[0].price).toBe(1.25)
    expect(windows[1].price).toBe(0.85)
  })

  test('creates the active, average, peak, and day summaries for the next 24 hours', () => {
    const windows = normalizePeakRates(
      Array.from({ length: 26 }, (_, index) => ({
        end: new Date(Date.UTC(2026, 5, 12, index + 1)).toISOString(),
        price: index / 10,
        start: new Date(Date.UTC(2026, 5, 12, index)).toISOString(),
      })),
    )
    const result = getPeakRateResult(windows, Date.UTC(2026, 5, 12, 1, 30), false)

    expect(result.error).toBe(false)
    expect(result.now).toBe('0.10')
    expect(result.hourlyPrices).toHaveLength(24)
    expect(result.average).toBe('1.30')
    expect(result.peak).toBe('2.50')
    expect(result.days.length).toBeGreaterThan(0)
  })
})
