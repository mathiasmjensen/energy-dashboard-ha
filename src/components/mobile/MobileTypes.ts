import type { BatteryOptimizerState } from '../../models/batteryOptimizer'
import type { DataStateBadgeModel } from '../../models/dataState'
import type { InsightHeaderControls } from '../../models/dashboardInsights'
import type { EvChargerController } from '../../models/evChargePlan'

export type InsightItem = {
  label: string
  value: string
}

export type InsightChart = {
  dataState?: DataStateBadgeModel
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
    dataState: DataStateBadgeModel
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
  batteryOptimizer: BatteryOptimizerState
  energyDayControls: {
    canGoNext: boolean
    canGoPrevious: boolean
    label: string
    onNext: () => void
    onPrevious: () => void
  }
  insightControls: InsightHeaderControls
  batteryHistory: {
    day: { labels: string[]; points: number[] }
    month: { labels: string[]; points: number[] }
    quarter: { labels: string[]; points: number[] }
    source: 'fallback' | 'ha'
    week: { labels: string[]; points: number[] }
  }
  distribution: {
    battery: string
    batteryCharge: string
    batteryDischarge: string
    dataState: DataStateBadgeModel
    ev: string
    gridExport: string
    gridImport: string
    grid: string
    home: string
    solar: string
  }
  overview: {
    batteryMeta: string
    batteryPower: string
    dataState: DataStateBadgeModel
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
    dataState: DataStateBadgeModel
    labels: string[]
    value: string
  }
  weather: {
    condition: string
    dataState: DataStateBadgeModel
    temperature: string
  }
}
