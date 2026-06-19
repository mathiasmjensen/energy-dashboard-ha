import { expect, test } from '@playwright/test'
import {
  formatBatteryStatus,
  formatGridStatus,
  formatState,
  formatWeather,
  getEvccSchedulePlans,
  getNumericState,
} from '../src/services/energyEntityFormatting'
import type { ResolvedEnergyEntities } from '../src/data/resolveEnergyEntities'

function entity(state: string, attributes: Record<string, unknown> = {}) {
  return {
    attributes,
    context: { id: '', parent_id: null, user_id: null },
    entity_id: '',
    last_changed: '',
    last_reported: '',
    last_updated: '',
    state,
  }
}

test.describe('energy entity formatting service', () => {
  test('normalizes scaled power readings while displaying non-negative kW values', () => {
    const resolved = {
      gridPower: {
        entity: entity('-800'),
        entityId: 'sensor.evcc_grid_power',
      },
    } satisfies ResolvedEnergyEntities

    expect(getNumericState(resolved, 'gridPower')).toBe(-0.8)
    expect(formatState(resolved, 'gridPower', 'kW')).toBe('0.8')
    expect(formatGridStatus(getNumericState(resolved, 'gridPower'))).toBe('Exporting')
  })

  test('uses battery direction text instead of signed display values', () => {
    expect(formatBatteryStatus(-0.9)).toBe('Charging')
    expect(formatBatteryStatus(1.2)).toBe('Discharging')
    expect(formatBatteryStatus(0.01)).toBe('Idle')
  })

  test('formats weather entities for dashboard status chips', () => {
    const resolved = {
      weatherHome: {
        entity: entity('partlycloudy', {
          temperature: 12.36,
          temperature_unit: '°C',
        }),
        entityId: 'weather.home',
      },
    } satisfies ResolvedEnergyEntities

    expect(formatWeather(resolved, 'weatherHome')).toEqual({
      condition: 'Partly cloudy',
      temperature: '12.4 C',
    })
  })

  test('normalizes EVCC schedule plans from HA sensor attributes', () => {
    const resolved = {
      evccVehicleRepeatingPlans: {
        entity: entity('unknown', {
          plans: [
            {
              active: true,
              id: 'night',
              label: 'Night charge',
              plan: {
                soc: 80,
                time: '23:00:00',
                weekdays: [1, 2, 3, 4, 5],
              },
            },
          ],
        }),
        entityId: 'sensor.evcc_carport_vehicle_plans_soc',
      },
    } satisfies ResolvedEnergyEntities

    expect(getEvccSchedulePlans(resolved)).toEqual([
      {
        active: true,
        id: 'night',
        label: 'Night charge',
        soc: '80',
        time: '23:00',
        weekdays: 'Mon, Tue, Wed, Thu, Fri',
        weekdaysValue: [1, 2, 3, 4, 5],
      },
    ])
  })
})
