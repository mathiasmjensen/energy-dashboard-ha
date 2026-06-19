import type { EvChargerController } from '../../hooks/useEvChargerController'

export type InsightItem = {
  label: string
  value: string
}

export type InsightChart = {
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  summaryItems: InsightItem[]
  totalKwh?: string
  primaryValue?: string
  windowLabel: string
}

export type MobileTab = 'battery' | 'ev' | 'home' | 'solar'
export type SolarPeriod = 'Day' | 'Month' | 'Week' | 'Year'
export type BatteryPeriod = 'Day' | 'Month' | 'Week'

export type MobileDashboardProps = {
  battery: {
    capacity: string
    energy: string
    power: string
    soc: string
    socValue: number
    status: string
  }
  charger: {
    chargeRate: string
    sessionDuration: string
    sessionEnergy: string
    status: string
  }
  controller: EvChargerController
  displayDate: string
  displayTime: string
  distribution: {
    battery: string
    ev: string
    grid: string
    home: string
    solar: string
  }
  overview: {
    batteryMeta: string
    batteryPower: string
    evMeta: string
    evPower: string
    gridMeta: string
    gridPower: string
    homePower: string
    solarPower: string
  }
  prices: InsightChart & { primaryValue: string }
  solarForecast: InsightChart & { totalKwh: string }
  solarProduction: {
    curve: number[]
    value: string
  }
}
