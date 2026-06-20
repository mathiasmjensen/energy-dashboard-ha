import { expect, test } from '@playwright/test'
import { fetchFoxCloudReport } from './helpers/foxCloud'

const config = {
  apiDomain: 'https://www.foxesscloud.com',
  apiKey: 'b320a8f2-513e-4213-889a-f47231cc4859',
  deviceSn: '60HD1030581M280',
  timezone: 'Europe/Copenhagen',
} as const

test.describe('Fox Cloud integration', () => {
  test('fetches monthly day buckets used for Home Assistant daily totals', async () => {
    const now = new Date()
    const payload = await fetchFoxCloudReport(config, {
      day: now.getDate(),
      dimension: 'month',
      month: now.getMonth() + 1,
      variables: ['generation', 'loads', 'feedin', 'gridConsumption', 'chargeEnergyToTal', 'dischargeEnergyToTal'],
      year: now.getFullYear(),
    })

    expect(payload.errno, payload.msg).toBe(0)
    expect(Array.isArray(payload.result)).toBe(true)
    expect(payload.result?.some((item) => item.variable === 'generation')).toBe(true)
    expect(payload.result?.some((item) => item.variable === 'gridConsumption')).toBe(true)
    expect(payload.result?.some((item) => item.variable === 'loads')).toBe(true)
  })

  test('returns a 24-point generation series from the day report for the solar production chart', async () => {
    const now = new Date()
    const payload = await fetchFoxCloudReport(config, {
      day: now.getDate(),
      dimension: 'day',
      month: now.getMonth() + 1,
      variables: ['generation', 'feedin', 'gridConsumption', 'chargeEnergyToTal', 'dischargeEnergyToTal'],
      year: now.getFullYear(),
    })

    expect(payload.errno, payload.msg).toBe(0)
    expect(Array.isArray(payload.result)).toBe(true)
    const generation = payload.result?.find((item) => item.variable === 'generation')
    expect(generation).toBeTruthy()
    expect(Array.isArray(generation?.values)).toBe(true)
    expect(generation?.values).toHaveLength(24)
  })
})
