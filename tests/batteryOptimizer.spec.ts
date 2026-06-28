import { expect, test } from '@playwright/test'
import {
  createMockBatteryOptimizerSnapshot,
  isBatteryOptimizerStale,
  normalizeBatteryOptimizerSnapshot,
  type BatteryOptimizerLiveInputs,
} from '../src/services/batteryOptimizer'

const baseInputs: BatteryOptimizerLiveInputs = {
  batteryPowerKw: 2.4,
  batterySocPercent: 74,
  batteryStatus: 'Charging',
  currentPriceDkkPerKwh: 1.84,
  gridPowerKw: -0.6,
  peakRateDays: [
    {
      average: '1.65',
      date: '2026-06-25',
      label: 'Today',
      peak: '2.41',
      prices: Array.from({ length: 48 }, (_, index) => ({
        date: index < 24 ? '2026-06-25' : '2026-06-26',
        endIso: new Date(Date.UTC(2026, 5, 25, index + 1)).toISOString(),
        hour: index % 24,
        label: `${String(index % 24).padStart(2, '0')}:00`,
        price: 1.1 + index * 0.03,
        startIso: new Date(Date.UTC(2026, 5, 25, index)).toISOString(),
      })),
    },
  ],
  solarForecastWindows: Array.from({ length: 12 }, (_, index) => ({
    endTime: new Date(Date.UTC(2026, 5, 25, index + 9)).toISOString(),
    kwh: index < 2 ? 0 : 0.6 + index * 0.2,
    powerKw: index < 2 ? 0 : 0.8 + index * 0.25,
    time: new Date(Date.UTC(2026, 5, 25, index + 8)).toISOString(),
  })),
}

test.describe('battery optimizer service', () => {
  test('creates a mock snapshot with plan, summary, settings, and charts', () => {
    const snapshot = createMockBatteryOptimizerSnapshot(baseInputs, {
      nowMs: Date.parse('2026-06-25T10:30:00.000Z'),
    })

    expect(snapshot.source).toBe('mock')
    expect(snapshot.planRows.length).toBeGreaterThanOrEqual(24)
    expect(snapshot.settings.autoMode).toBeTruthy()
    expect(snapshot.status.recommendation).toBeTruthy()
    expect(snapshot.decisionSummary.bestBuyHours.length + snapshot.decisionSummary.bestSellHours.length).toBeGreaterThan(0)
    expect(snapshot.charts.priceCurve.points).toHaveLength(snapshot.planRows.length)
    expect(snapshot.charts.socForecast.points).toHaveLength(snapshot.planRows.length)
  })

  test('normalizes live payloads but prefers live HA now-values for current metrics', () => {
    const snapshot = normalizeBatteryOptimizerSnapshot({
      inputs: baseInputs,
      planPayload: {
        rows: [
          {
            action: 'SELL',
            endIso: '2026-06-25T12:00:00.000Z',
            expectedHouseUsageKwh: 1.8,
            expectedProfitDkk: 1.2,
            expectedSolarSurplusKwh: 2.4,
            fullBuyPriceDkkPerKwh: 2.15,
            sellPriceDkkPerKwh: 1.74,
            spotPriceDkkPerKwh: 1.66,
            startIso: '2026-06-25T11:00:00.000Z',
            targetSocPercent: 68,
          },
        ],
        updatedAt: '2026-06-25T09:40:00.000Z',
      },
      settingsPayload: {
        allowBatteryExport: false,
        autoMode: false,
        dryRun: false,
        maxGridChargeKwh: 4,
        minReservePercent: 30,
      },
      source: 'live',
      statusPayload: {
        batteryPowerKw: 9.9,
        gridPowerKw: 9.9,
        mode: 'manual',
        recommendation: 'SELL',
        socPercent: 12,
        spotPriceDkkPerKwh: 9.9,
        updatedAt: '2026-06-25T09:40:00.000Z',
      },
    })

    expect(snapshot.source).toBe('live')
    expect(snapshot.status.batteryPowerKw).toBe(2.4)
    expect(snapshot.status.gridPowerKw).toBe(-0.6)
    expect(snapshot.status.socPercent).toBe(74)
    expect(snapshot.status.spotPriceDkkPerKwh).toBe(1.84)
    expect(snapshot.settings.allowBatteryExport).toBeFalsy()
    expect(snapshot.settings.minReservePercent).toBe(30)
    expect(snapshot.planRows).toHaveLength(1)
  })

  test('marks stale optimizer data older than thirty minutes', () => {
    expect(isBatteryOptimizerStale('2026-06-25T10:00:00.000Z', Date.parse('2026-06-25T10:20:00.000Z'))).toBeFalsy()
    expect(isBatteryOptimizerStale('2026-06-25T10:00:00.000Z', Date.parse('2026-06-25T10:31:00.000Z'))).toBeTruthy()
  })
})
