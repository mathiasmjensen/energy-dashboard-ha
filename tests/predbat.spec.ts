import { expect, test } from '@playwright/test'
import { buildPredbatSnapshotPayloads, resolvePredbatEntities } from '../src/services/predbat'
import type { BatteryOptimizerLiveInputs } from '../src/models/batteryOptimizer'

const inputs: BatteryOptimizerLiveInputs = {
  batteryPowerKw: null,
  batterySocPercent: null,
  batteryStatus: 'Idle',
  currentPriceDkkPerKwh: null,
  gridPowerKw: null,
  peakRateDays: [],
  solarForecastWindows: [],
}

function entity(state: string) {
  return {
    attributes: {},
    context: { id: '', parent_id: null, user_id: null },
    entity_id: '',
    last_changed: '2026-08-02T20:00:00.000Z',
    last_reported: '2026-08-02T20:00:00.000Z',
    last_updated: '2026-08-02T20:00:00.000Z',
    state,
  }
}

test.describe('Predbat entity resolution', () => {
  test('discovers the Fox-backed Predbat battery entities published by the Docker app', () => {
    const entities = {
      'predbat.battery_power': entity('0.7'),
      'predbat.grid_power': entity('0.01'),
      'predbat.plan_html': entity('<table></table>'),
      'predbat.status': entity('Executing plan'),
      'sensor.predbat_fox_60hd1030581m280_battery_capacity': entity('8'),
      'sensor.predbat_fox_60hd1030581m280_soc': entity('53'),
      'switch.predbat_active': entity('on'),
    } as never

    const resolved = resolvePredbatEntities(entities)

    expect(resolved.statusSensor?.entityId).toBe('predbat.status')
    expect(resolved.planSensor?.entityId).toBe('predbat.plan_html')
    expect(resolved.batteryPowerSensor?.entityId).toBe('predbat.battery_power')
    expect(resolved.gridPowerSensor?.entityId).toBe('predbat.grid_power')
    expect(resolved.batterySocSensor?.entityId).toBe('sensor.predbat_fox_60hd1030581m280_soc')
    expect(resolved.batteryCapacitySensor?.entityId).toBe('sensor.predbat_fox_60hd1030581m280_battery_capacity')

    const payloads = buildPredbatSnapshotPayloads(resolved, inputs)
    expect(payloads.statusPayload.batteryPowerKw).toBe(0.7)
    expect(payloads.statusPayload.gridPowerKw).toBe(0.01)
    expect(payloads.statusPayload.socPercent).toBe(53)
  })
})
