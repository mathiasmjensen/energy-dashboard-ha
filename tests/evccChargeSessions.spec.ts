import { expect, test } from '@playwright/test'
import { getEvccSessionsFromAttributes, getEvccSessionsUrl, mapEvccSessions } from '../src/services/evccChargeSessions'

test.describe('EVCC charge sessions service', () => {
  test('maps EVCC sessions into display rows sorted newest first', () => {
    const sessions = mapEvccSessions([
      {
        chargedEnergy: 0,
        chargeDuration: 30 * 60 * 1_000_000_000,
        created: '2026-06-11T20:00:00+02:00',
        finished: null,
        id: 1,
        loadpoint: 'Carport',
        price: null,
      },
      {
        chargedEnergy: 12.34,
        chargeDuration: 95 * 60 * 1_000_000_000,
        created: '2026-06-12T20:00:00+02:00',
        finished: '2026-06-12T21:35:00+02:00',
        id: 2,
        price: 18.456,
        vehicle: 'Tesla Model Y',
      },
    ])

    expect(sessions.map((session) => session.id)).toEqual(['2', '1'])
    expect(sessions[0]).toMatchObject({
      costDkk: '18.46',
      durationLabel: '1h 35m',
      energyKwh: '12.3',
      vehicle: 'Tesla Model Y',
    })
    expect(sessions[1]).toMatchObject({
      costDkk: null,
      durationLabel: '30m',
      energyKwh: '---',
      vehicle: 'Carport',
    })
  })

  test('reads EVCC sessions from HA sensor attributes without a default browser LAN URL', () => {
    const sessions = getEvccSessionsFromAttributes({
      sessions: [
        {
          chargedEnergy: 4,
          chargeDuration: 60 * 60 * 1_000_000_000,
          created: '2026-06-12T20:00:00+02:00',
          finished: '2026-06-12T21:00:00+02:00',
          id: 3,
          price: 6.5,
          vehicle: 'Tesla',
        },
      ],
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0].energyKwh).toBe('4.0')
    expect(getEvccSessionsUrl()).toBe('')
  })
})
