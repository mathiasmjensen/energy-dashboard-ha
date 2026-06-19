import { expect, test } from '@playwright/test'
import { getForecastResult, normalizeEvccForecast, normalizeForecast } from '../src/services/solarForecast'

test.describe('solar forecast service', () => {
  test('normalizes Open-Meteo irradiance into hourly kWh and power', () => {
    const windows = normalizeForecast(
      {
        hourly: {
          global_tilted_irradiance: [0, 500, null, 1000],
          time: [
            '2026-06-12T00:00',
            '2026-06-12T01:00',
            '2026-06-12T02:00',
            '2026-06-12T03:00',
          ],
        },
      },
      10,
    )

    expect(windows).toHaveLength(3)
    expect(windows[1].kwh).toBe(5)
    expect(windows[2].powerKw).toBe(10)
  })

  test('normalizes EVCC watt rates into kWh over each window duration', () => {
    const windows = normalizeEvccForecast({
      rates: [
        {
          end: '2026-06-12T12:30:00+02:00',
          start: '2026-06-12T10:30:00+02:00',
          value: 2500,
        },
      ],
    })

    expect(windows).toEqual([
      {
        endTime: '2026-06-12T12:30:00+02:00',
        kwh: 5,
        powerKw: 2.5,
        time: '2026-06-12T10:30:00+02:00',
      },
    ])
  })

  test('builds hourly result series and remaining EVCC forecast totals', () => {
    const nowMs = Date.parse('2026-06-12T10:30:00+02:00')
    const windows = normalizeEvccForecast({
      rates: [
        {
          end: '2026-06-12T10:00:00+02:00',
          start: '2026-06-12T09:00:00+02:00',
          value: 1000,
        },
        {
          end: '2026-06-12T12:00:00+02:00',
          start: '2026-06-12T11:00:00+02:00',
          value: 3000,
        },
      ],
    })
    const result = getForecastResult(windows, 'evcc', nowMs)

    expect(result.todayKwh).toBe('3.0')
    expect(result.maxPowerKw).toBe('3.0')
    expect(result.hourlyPowerKw[11]).toBe(3)
  })
})
