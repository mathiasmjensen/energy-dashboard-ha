import { useMemo } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { pickArrayValue, pickDisplayValue, pickNumberValue, getDashboardMockData } from '../services/dashboardMockData'
import {
  formatBatteryKwh,
  getBatteryDailyEnergyTotal,
  inferBatteryEnergyRole,
  resolveBatteryEnergyMetrics,
} from '../services/batteryMetrics'
import {
  boundedPercent,
  formatBatteryStatus,
  formatChargingStatus,
  formatGridStatus,
  formatPlanEnabled,
  formatPlanTime,
  formatState,
  formatWeather,
  getEntityOptions,
  getEvccSchedulePlans,
  getNumericState,
  getResolvedEntity,
} from '../services/energyEntityFormatting'
import { getSolarProductionCurveFromAttributes } from '../services/solarProduction'

export function useEnergyData() {
  const entities = useHass((state) => state.entities)

  return useMemo(() => {
    const mock = getDashboardMockData().energyData
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
    const batteryChargeTodayValue = getNumericState(resolved, 'batteryChargeToday')
    const batteryDischargeTodayValue = getNumericState(resolved, 'batteryDischargeToday')
    const evChargePowerValue = getNumericState(resolved, 'evChargePower')
    const gridPowerValue = getNumericState(resolved, 'gridPower')
    const selfPowered = getNumericState(resolved, 'selfPoweredPercent')
    const solarPowerValue = getNumericState(resolved, 'solarPower')
    const weather = formatWeather(resolved, 'weatherHome')
    const solarProductionFeedEntity = getResolvedEntity(resolved, 'solarProductionFeed')
    const solarProductionFeed = getSolarProductionCurveFromAttributes(
      (solarProductionFeedEntity?.attributes ?? {}) as Record<string, unknown>,
      solarProductionFeedEntity?.state ?? null,
    )
    const batteryStatus = formatBatteryStatus(batteryPowerValue)
    const chargePlanEntity = getResolvedEntity(resolved, 'evccChargePlanEnabled')
    const batteryDistributionTodayValue = getBatteryDailyEnergyTotal({
      chargeTodayKwh: batteryChargeTodayValue,
      dischargeTodayKwh: batteryDischargeTodayValue,
      status: batteryStatus,
    })

    return {
      weatherCondition: pickDisplayValue(weather.condition, mock.weatherCondition),
      weatherTemperature: pickDisplayValue(weather.temperature, mock.weatherTemperature),
      solarPower: pickDisplayValue(formatState(resolved, 'solarPower', 'kW'), mock.solarPower),
      solarPowerValue: pickNumberValue(solarPowerValue, mock.solarPowerValue),
      solarPercent: pickDisplayValue(formatState(resolved, 'solarPercent', '%'), mock.solarPercent),
      homePower: pickDisplayValue(formatState(resolved, 'homePower', 'kW'), mock.homePower),
      homePercent: pickDisplayValue(formatState(resolved, 'homePercent', '%'), mock.homePercent),
      gridPower: pickDisplayValue(formatState(resolved, 'gridPower', 'kW'), mock.gridPower),
      gridPowerValue: pickNumberValue(gridPowerValue, mock.gridPowerValue),
      gridStatus: pickDisplayValue(formatGridStatus(gridPowerValue), mock.gridStatus),
      gridExportedToday: pickDisplayValue(formatState(resolved, 'gridExportedToday', 'kWh'), mock.gridExportedToday),
      evChargePercent: pickDisplayValue(formatState(resolved, 'evChargePercent', '%'), mock.evChargePercent),
      evChargePower: pickDisplayValue(formatState(resolved, 'evChargePower', 'kW'), mock.evChargePower),
      evRange: pickDisplayValue(formatState(resolved, 'evRange', 'KM'), mock.evRange),
      evChargePowerValue: pickNumberValue(evChargePowerValue, mock.evChargePowerValue),
      evChargeRateLimit: pickDisplayValue(formatState(resolved, 'evChargeRateLimit', 'A'), mock.evChargeRateLimit),
      evChargeSessionEnergy: pickDisplayValue(formatState(resolved, 'evChargeSessionEnergy', 'kWh'), mock.evChargeSessionEnergy),
      evChargeSessionDuration: pickDisplayValue(formatState(resolved, 'evChargeSessionDuration', 'text'), mock.evChargeSessionDuration),
      evChargeStatus: pickDisplayValue(formatChargingStatus(resolved, 'evChargeStatus'), mock.evChargeStatus),
      evccChargeMode: pickDisplayValue(formatState(resolved, 'evccLoadpointMode', 'text'), mock.evccChargeMode),
      evccChargeModeOptions: pickArrayValue(getEntityOptions(resolved, 'evccLoadpointMode'), mock.evccChargeModeOptions),
      evccChargePlanEnabled: chargePlanEntity ? formatPlanEnabled(resolved, 'evccChargePlanEnabled') : mock.evccChargePlanEnabled,
      evccChargePlanFrom: pickDisplayValue(formatPlanTime(resolved, 'evccChargePlanStart', '22:00'), mock.evccChargePlanFrom),
      evccChargePlanTo: pickDisplayValue(formatPlanTime(resolved, 'evccChargePlanEnd', '06:00'), mock.evccChargePlanTo),
      evccMaxCurrent: pickDisplayValue(formatState(resolved, 'evccLoadpointMaxCurrent', 'A'), mock.evccMaxCurrent),
      evccMaxCurrentOptions: pickArrayValue(getEntityOptions(resolved, 'evccLoadpointMaxCurrent'), mock.evccMaxCurrentOptions),
      evccSchedules: getEvccSchedulePlans(resolved),
      batterySoc: pickDisplayValue(formatState(resolved, 'batterySoc', '%'), mock.batterySoc),
      batterySocValue: batterySoc === null ? mock.batterySocValue : boundedPercent(batterySoc),
      batteryCapacity: pickDisplayValue(formatBatteryKwh(batteryEnergyMetrics.capacityKwh), mock.batteryCapacity),
      batteryCapacityValue: pickNumberValue(batteryEnergyMetrics.capacityKwh, mock.batteryCapacityValue),
      batteryEnergy: pickDisplayValue(formatBatteryKwh(batteryEnergyMetrics.storedEnergyKwh), mock.batteryEnergy),
      batteryStoredEnergyValue: pickNumberValue(batteryEnergyMetrics.storedEnergyKwh, mock.batteryStoredEnergyValue),
      batteryChargeToday: pickDisplayValue(formatBatteryKwh(batteryChargeTodayValue), mock.batteryChargeToday),
      batteryChargeTodayValue: pickNumberValue(batteryChargeTodayValue, mock.batteryChargeTodayValue),
      batteryDischargeToday: pickDisplayValue(formatBatteryKwh(batteryDischargeTodayValue), mock.batteryDischargeToday),
      batteryDischargeTodayValue: pickNumberValue(batteryDischargeTodayValue, mock.batteryDischargeTodayValue),
      batteryDistributionToday: pickDisplayValue(formatBatteryKwh(batteryDistributionTodayValue), mock.batteryDistributionToday),
      batteryDistributionTodayValue: pickNumberValue(batteryDistributionTodayValue, mock.batteryDistributionTodayValue),
      batteryPower: pickDisplayValue(formatState(resolved, 'batteryPower', 'kW'), mock.batteryPower),
      batteryPowerValue: pickNumberValue(batteryPowerValue, mock.batteryPowerValue),
      solarProductionToday: pickDisplayValue(formatState(resolved, 'solarProductionToday', 'kWh'), mock.solarProductionToday),
      solarProductionCurve: solarProductionFeed.available ? solarProductionFeed.values : mock.solarProductionCurve,
      solarProductionCurveAvailable: solarProductionFeed.available || mock.solarProductionCurve.length > 0,
      batteryStatus: batteryPowerValue === null ? mock.batteryStatus : batteryStatus,
      solarForecastToday: pickDisplayValue(formatState(resolved, 'solarForecastToday', 'kWh'), mock.solarForecastToday),
      selfPoweredPercent: pickDisplayValue(formatState(resolved, 'selfPoweredPercent', '%'), mock.selfPoweredPercent),
      selfPoweredValue: selfPowered === null ? mock.selfPoweredValue : boundedPercent(selfPowered),
      energyIndependence: pickDisplayValue(formatState(resolved, 'energyIndependence', 'kWh'), mock.energyIndependence),
      peakRateNow: pickDisplayValue(formatState(resolved, 'peakRateNow', 'price'), mock.peakRateNow),
      peakRateNext: pickDisplayValue(formatState(resolved, 'peakRateNext', 'price'), mock.peakRateNext),
    }
  }, [entities])
}
