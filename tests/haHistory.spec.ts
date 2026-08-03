import { expect, test } from '@playwright/test'
import { extractHaHistorySeries, requestHaHistory } from '../src/services/haHistory'

test.describe('Home Assistant history transport', () => {
  test('uses the authenticated HAKit WebSocket for history', async () => {
    const messages: Record<string, unknown>[] = []
    const payload = [[{ state: '53', last_changed: '2026-08-03T00:00:00Z' }]]
    const start = new Date('2026-08-02T00:00:00Z')
    const end = new Date('2026-08-03T00:00:00Z')

    const result = await requestHaHistory({
      apiBase: 'http://home-assistant.local',
      connection: {
        sendMessagePromise: async (message: Record<string, unknown>) => {
          messages.push(message)
          return payload
        },
      },
      end,
      entityIds: ['sensor.battery_soc'],
      start,
    })

    expect(result).toEqual(payload)
    expect(messages).toEqual([
      {
        end_time: end.toISOString(),
        entity_ids: ['sensor.battery_soc'],
        minimal_response: true,
        no_attributes: true,
        start_time: start.toISOString(),
        type: 'history/history_during_period',
      },
    ])
  })

  test('matches parallel history series to their requested entity', () => {
    const solar = [{ state: '1.2' }]
    const grid = [{ state: '-0.8' }]
    const entityIds = ['sensor.solar_power', 'sensor.grid_power']
    const payload = [solar, grid]

    expect(extractHaHistorySeries(payload, 'sensor.solar_power', entityIds)).toBe(solar)
    expect(extractHaHistorySeries(payload, 'sensor.grid_power', entityIds)).toBe(grid)
  })
})
