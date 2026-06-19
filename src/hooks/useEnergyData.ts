import { useMemo } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { formatBatteryKwh, inferBatteryEnergyRole, resolveBatteryEnergyMetrics } from '../services/batteryMetrics'
import {
  boundedPercent,
  formatBatteryStatus,
  formatChargingStatus,
  formatGridStatus,
  formatPlanEnabled,
  formatPlanTime,
  formatState,
  getEntityOptions,
  getEvccSchedulePlans,
  getNumericState,
  getResolvedEntity,
} from '../services/energyEntityFormatting'

export function useEnergyData() {
  const entities = useHass((state) => state.entities)

  return useMemo(() => {
    const resolved = resolveEnergyEntities(entities)
    const batterySoc = getNumericState(resolved, 'batterySoc')
    const rawBatteryEnergy = getNumericState(resolved, 'batteryEnergy')
    const batteryEnergyEntity = getResolvedEntity(resolved, 'batteryEnergy')
    const batteryEnergyMetrics = resolveBatteryEnergyMetrics({
      energyKwh: rawBatteryEnergy,
      energyRole: inferBatteryEnergyRole(
        resolved.batteryEnergy?.entityId,
        String(batteryEnergyEntity?.attributes.friendly_name ?? ''),
      ),
      socPercent: batterySoc,
    })
    const batteryPowerValue = getNumericState(resolved, 'batteryPower')
    const evChargePowerValue = getNumericState(resolved, 'evChargePower')
    const gridPowerValue = getNumericState(resolved, 'gridPower')
    const selfPowered = getNumericState(resolved, 'selfPoweredPercent')
    const solarPowerValue = getNumericState(resolved, 'solarPower')

    return {
      solarPower: formatState(resolved, 'solarPower', 'kW'),
      solarPowerValue,
      solarPercent: formatState(resolved, 'solarPercent', '%'),
      homePower: formatState(resolved, 'homePower', 'kW'),
      homePercent: formatState(resolved, 'homePercent', '%'),
      gridPower: formatState(resolved, 'gridPower', 'kW'),
      gridPowerValue,
      gridStatus: formatGridStatus(gridPowerValue),
      gridExportedToday: formatState(resolved, 'gridExportedToday', 'kWh'),
      evChargePercent: formatState(resolved, 'evChargePercent', '%'),
      evChargePower: formatState(resolved, 'evChargePower', 'kW'),
      evRange: formatState(resolved, 'evRange', 'KM'),
      evChargePowerValue,
      evChargeRateLimit: formatState(resolved, 'evChargeRateLimit', 'A'),
      evChargeSessionEnergy: formatState(resolved, 'evChargeSessionEnergy', 'kWh'),
      evChargeSessionDuration: formatState(resolved, 'evChargeSessionDuration', 'text'),
      evChargeStatus: formatChargingStatus(resolved, 'evChargeStatus'),
      evccChargeMode: formatState(resolved, 'evccLoadpointMode', 'text'),
      evccChargeModeOptions: getEntityOptions(resolved, 'evccLoadpointMode'),
      evccChargePlanEnabled: formatPlanEnabled(resolved, 'evccChargePlanEnabled'),
      evccChargePlanFrom: formatPlanTime(resolved, 'evccChargePlanStart', '22:00'),
      evccChargePlanTo: formatPlanTime(resolved, 'evccChargePlanEnd', '06:00'),
      evccMaxCurrent: formatState(resolved, 'evccLoadpointMaxCurrent', 'A'),
      evccMaxCurrentOptions: getEntityOptions(resolved, 'evccLoadpointMaxCurrent'),
      evccSchedules: getEvccSchedulePlans(resolved),
      batterySoc: formatState(resolved, 'batterySoc', '%'),
      batterySocValue: boundedPercent(batterySoc),
      batteryCapacity: formatBatteryKwh(batteryEnergyMetrics.capacityKwh),
      batteryCapacityValue: batteryEnergyMetrics.capacityKwh,
      batteryEnergy: formatBatteryKwh(batteryEnergyMetrics.storedEnergyKwh),
      batteryStoredEnergyValue: batteryEnergyMetrics.storedEnergyKwh,
      batteryPower: formatState(resolved, 'batteryPower', 'kW'),
      batteryPowerValue,
      solarProductionToday: formatState(resolved, 'solarProductionToday', 'kWh'),
      batteryStatus: formatBatteryStatus(batteryPowerValue),
      solarForecastToday: formatState(resolved, 'solarForecastToday', 'kWh'),
      selfPoweredPercent: formatState(resolved, 'selfPoweredPercent', '%'),
      selfPoweredValue: boundedPercent(selfPowered),
      energyIndependence: formatState(resolved, 'energyIndependence', 'kWh'),
      peakRateNow: formatState(resolved, 'peakRateNow', 'price'),
      peakRateNext: formatState(resolved, 'peakRateNext', 'price'),
    }
  }, [entities])
}
