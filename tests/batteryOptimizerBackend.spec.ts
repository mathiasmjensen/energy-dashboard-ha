import { expect, test } from '@playwright/test'

test.describe('battery optimizer backend core', () => {
  test('normalizes price windows and computes a usable optimizer snapshot', async () => {
    const {
      buildOptimizerSnapshot,
      createDefaultServerState,
      normalizeLiveStatus,
      normalizePriceWindows,
      normalizeSolarForecast,
    } = await import('../server/battery-optimizer-core.mjs')

    const liveStatus = normalizeLiveStatus({
      batteryPowerKw: 1.4,
      batterySocPercent: 72,
      gridPowerKw: -0.5,
      homePowerKw: 0.9,
      solarPowerKw: 4.2,
    })

    const priceWindows = normalizePriceWindows(
      Array.from({ length: 36 }, (_, index) => ({
        end: new Date(Date.UTC(2026, 5, 25, index + 1)).toISOString(),
        price: 1.05 + index * 0.04,
        start: new Date(Date.UTC(2026, 5, 25, index)).toISOString(),
      })),
    )

    const solarForecast = normalizeSolarForecast({
      rates: Array.from({ length: 18 }, (_, index) => ({
        end: new Date(Date.UTC(2026, 5, 25, index + 7)).toISOString(),
        start: new Date(Date.UTC(2026, 5, 25, index + 6)).toISOString(),
        value: index < 2 ? 0 : 1200 + index * 180,
      })),
    })

    const snapshot = buildOptimizerSnapshot({
      liveStatus,
      nowMs: Date.parse('2026-06-25T08:30:00.000Z'),
      priceAdjustmentDkk: 0.42,
      priceWindows,
      sellAdjustmentDkk: 0.16,
      serverState: createDefaultServerState(),
      solarForecastWindows: solarForecast,
    })

    expect(snapshot.status.socPercent).toBe(72)
    expect(snapshot.status.spotPriceDkkPerKwh).toBeGreaterThan(0)
    expect(snapshot.planRows.length).toBeGreaterThan(20)
    expect(snapshot.decisionSummary.expectedDailyArbitrageProfitDkk).toBeDefined()
    expect(snapshot.charts.priceCurve.points).toHaveLength(snapshot.planRows.length)
    expect(snapshot.charts.socForecast.points).toHaveLength(snapshot.planRows.length)
  })

  test('merges settings while preserving defaults', async () => {
    const { createDefaultServerState, mergeSettings } = await import('../server/battery-optimizer-core.mjs')
    const merged = mergeSettings(createDefaultServerState().settings, {
      allowGridCharging: false,
      minReservePercent: 34,
      pausedUntil: '2026-06-26T00:00:00.000Z',
    })

    expect(merged.autoMode).toBeTruthy()
    expect(merged.allowGridCharging).toBeFalsy()
    expect(merged.minReservePercent).toBe(34)
    expect(merged.pausedUntil).toBe('2026-06-26T00:00:00.000Z')
  })
})
