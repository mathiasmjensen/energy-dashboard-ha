import { expect, test } from '@playwright/test'
import {
  formatBatteryKwh,
  getBatteryTimeEstimate,
  inferBatteryEnergyRole,
  resolveBatteryEnergyMetrics,
} from '../src/services/batteryMetrics'

test.describe('battery metrics service', () => {
  test('derives stored energy from a capacity entity and state of charge', () => {
    const metrics = resolveBatteryEnergyMetrics({
      energyKwh: 10,
      energyRole: inferBatteryEnergyRole('sensor.evcc_battery_capacity', 'EVCC Battery Capacity'),
      socPercent: 76,
    })

    expect(metrics.capacityKwh).toBe(10)
    expect(metrics.storedEnergyKwh).toBeCloseTo(7.6)
    expect(formatBatteryKwh(metrics.storedEnergyKwh)).toBe('7.6')
  })

  test('keeps stored-energy entities as stored energy and infers capacity from soc', () => {
    const metrics = resolveBatteryEnergyMetrics({
      energyKwh: 6,
      energyRole: inferBatteryEnergyRole('sensor.foxess_battery_energy', 'FoxESS Battery Energy'),
      socPercent: 60,
    })

    expect(metrics.storedEnergyKwh).toBe(6)
    expect(metrics.capacityKwh).toBeCloseTo(10)
  })

  test('uses the same stored/capacity values for charge and discharge estimates', () => {
    expect(
      getBatteryTimeEstimate({
        capacityKwh: 10,
        powerKw: 1.2,
        socPercent: 76,
        status: 'Charging',
        storedEnergyKwh: 7.6,
      }),
    ).toEqual({ label: 'Time to full', value: '2h 0m' })

    expect(
      getBatteryTimeEstimate({
        capacityKwh: 10,
        powerKw: 1.9,
        socPercent: 76,
        status: 'Discharging',
        storedEnergyKwh: 7.6,
      }),
    ).toEqual({ label: 'Time to empty', value: '4h 0m' })
  })
})
