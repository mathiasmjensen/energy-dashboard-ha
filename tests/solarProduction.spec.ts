import { expect, test } from '@playwright/test'
import { getSolarProductionCurveFromAttributes } from '../src/services/solarProduction'

test.describe('solar production service', () => {
  test('normalizes hourly Fox Cloud production rows into a 24-point chart series', () => {
    const result = getSolarProductionCurveFromAttributes({
      hourly_solar_production: [
        { label: '00:00', value: 0 },
        { label: '01:00', value: 0.2 },
        { label: '12:00', value: 4.8 },
      ],
    })

    expect(result.available).toBe(true)
    expect(result.values).toHaveLength(24)
    expect(result.values[0]).toBe(0)
    expect(result.values[1]).toBe(0.2)
    expect(result.values[12]).toBe(4.8)
  })

  test('falls back to an empty visible series when no hourly production data exists', () => {
    const result = getSolarProductionCurveFromAttributes({})

    expect(result.available).toBe(false)
    expect(result.values).toHaveLength(24)
    expect(result.values.every((value) => value === 0)).toBe(true)
  })
})
