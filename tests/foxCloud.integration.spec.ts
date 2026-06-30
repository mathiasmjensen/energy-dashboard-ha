import { expect, test } from '@playwright/test'
import { fetchFoxCloudReport } from './helpers/foxCloud'

const apiKey = process.env.TEST_FOXESS_API_KEY?.trim()
const deviceSn = process.env.TEST_FOXESS_DEVICE_SN?.trim()
const apiDomain = process.env.TEST_FOXESS_API_DOMAIN?.trim() || 'https://www.foxesscloud.com'
const timezone = process.env.TEST_FOXESS_TIMEZONE?.trim() || 'Europe/Copenhagen'

const config =
  apiKey && deviceSn
    ? {
        apiDomain,
        apiKey,
        deviceSn,
        timezone,
      }
    : null

test.describe('Fox Cloud integration', () => {
  test('fetches monthly day buckets used for Home Assistant daily totals', async () => {
    test.skip(!config, 'Set TEST_FOXESS_API_KEY and TEST_FOXESS_DEVICE_SN to run live FoxESS integration tests.')
    const now = new Date()
    const payload = await fetchFoxCloudReport(config!, {
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
    test.skip(!config, 'Set TEST_FOXESS_API_KEY and TEST_FOXESS_DEVICE_SN to run live FoxESS integration tests.')
    const now = new Date()
    const payload = await fetchFoxCloudReport(config!, {
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
