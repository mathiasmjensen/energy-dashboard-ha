import type { PeakRateWindow } from './peakRates'
import type { SolarForecastSource, SolarForecastState } from './solarForecast'
import type { TodayEnergyTotals } from './todayEnergyTotals'

export interface MockEnergyDataPayload {
  batteryCapacity: string
  batteryCapacityValue: number
  batteryChargeToday: string
  batteryChargeTodayValue: number
  batteryDischargeToday: string
  batteryDischargeTodayValue: number
  batteryDistributionToday: string
  batteryDistributionTodayValue: number
  batteryEnergy: string
  batteryPower: string
  batteryPowerValue: number
  batterySoc: string
  batterySocValue: number
  batteryStatus: string
  batteryStoredEnergyValue: number
  energyIndependence: string
  evChargePercent: string
  evChargePower: string
  evChargePowerValue: number
  evChargeRateLimit: string
  evChargeSessionDuration: string
  evChargeSessionEnergy: string
  evChargeStatus: string
  evRange: string
  evccChargeMode: string
  evccChargeModeOptions: string[]
  evccChargePlanEnabled: boolean
  evccChargePlanFrom: string
  evccChargePlanTo: string
  evccMaxCurrent: string
  evccMaxCurrentOptions: string[]
  gridExportedToday: string
  gridPower: string
  gridPowerValue: number
  gridStatus: string
  homePercent: string
  homePower: string
  peakRateNext: string
  peakRateNow: string
  selfPoweredPercent: string
  selfPoweredValue: number
  solarForecastToday: string
  solarPercent: string
  solarPower: string
  solarPowerValue: number
  solarProductionCurve: number[]
  solarProductionToday: string
  weatherCondition: string
  weatherTemperature: string
}

export interface MockPeakRatesPayload {
  hourlyPricesDkk: number[]
}

export interface MockSolarForecastPayload {
  hourlyPowerKw: number[]
  source: SolarForecastSource
}

export interface MockHistoricalEnergyDayPayload {
  distribution: {
    battery: string
    batteryCharge: string
    batteryDischarge: string
    ev: string
    grid: string
    gridExport: string
    gridImport: string
    home: string
    solar: string
  }
  solarProduction: {
    curve: number[]
    labels: string[]
    value: string
  }
}

export interface DashboardMockData {
  energyData: MockEnergyDataPayload
  historicalEnergyDay: MockHistoricalEnergyDayPayload
  peakRateWindows: PeakRateWindow[]
  solarForecastState: SolarForecastState
  todayEnergyTotals: TodayEnergyTotals
}
