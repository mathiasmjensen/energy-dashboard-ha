import { expect, test } from '@playwright/test'
import { formatKwh, integrateHistorySeries } from '../src/services/todayEnergyTotals'

test.describe('today energy totals service', () => {
  test('integrates W history into kWh using the supplied clamp rule', () => {
    const rows = [
      {
        attributes: { unit_of_measurement: 'W' },
        last_changed: '2026-06-12T00:00:00.000Z',
        state: '1000',
      },
      {
        attributes: { unit_of_measurement: 'W' },
        last_changed: '2026-06-12T01:00:00.000Z',
        state: '-500',
      },
    ]
    const nowMs = Date.parse('2026-06-12T03:00:00.000Z')

    expect(integrateHistorySeries(rows, nowMs, (value) => Math.max(0, value))).toBe(1)
    expect(integrateHistorySeries(rows, nowMs, Math.abs)).toBe(2)
  })

  test('formats invalid totals as placeholders', () => {
    expect(formatKwh(1.234)).toBe('1.2')
    expect(formatKwh(Number.NaN)).toBe('---')
  })
})
