import type { PeakRateDay } from './peakRates'
import type { SolarForecastWindow } from './solarForecast'

export type BatteryOptimizerRecommendation = 'BUY' | 'CHARGE' | 'DISCHARGE' | 'HOLD' | 'SELL'
export type BatteryOptimizerMode = 'auto' | 'charge' | 'discharge' | 'export' | 'idle' | 'manual'
export type BatteryOptimizerSource = 'live' | 'mock'

export type BatteryOptimizerStatus = {
  batteryPowerKw: number
  estimatedProfitTodayDkk: number
  fullBuyPriceDkkPerKwh: number
  gridPowerKw: number
  mode: BatteryOptimizerMode
  recommendation: BatteryOptimizerRecommendation
  sellPriceDkkPerKwh: number
  socPercent: number
  spotPriceDkkPerKwh: number
  updatedAt: string
}

export type BatteryOptimizerPlanRow = {
  action: BatteryOptimizerRecommendation
  endIso: string
  expectedHouseUsageKwh: number
  expectedProfitDkk: number
  expectedSolarSurplusKwh: number
  fullBuyPriceDkkPerKwh: number
  sellPriceDkkPerKwh: number
  spotPriceDkkPerKwh: number
  startIso: string
  targetSocPercent: number
}

export type BatteryOptimizerDecisionSummary = {
  avoidBuyHours: string[]
  bestBuyHours: string[]
  bestSellHours: string[]
  evChargingRecommendation: string
  expectedDailyArbitrageProfitDkk: number
  reserveForHouseUsage: string
}

export type BatteryOptimizerSettings = {
  allowBatteryExport: boolean
  allowGridCharging: boolean
  autoMode: boolean
  dryRun: boolean
  maxGridChargeKwh: number
  minReservePercent: number
  pausedUntil: string | null
}

export type BatteryOptimizerChartSeries = {
  labels: string[]
  points: number[]
}

export type BatteryOptimizerCharts = {
  plannedBatteryPower: BatteryOptimizerChartSeries
  priceCurve: BatteryOptimizerChartSeries
  profitByHour: BatteryOptimizerChartSeries
  socForecast: BatteryOptimizerChartSeries
}

export type BatteryOptimizerSnapshot = {
  charts: BatteryOptimizerCharts
  decisionSummary: BatteryOptimizerDecisionSummary
  planRows: BatteryOptimizerPlanRow[]
  settings: BatteryOptimizerSettings
  source: BatteryOptimizerSource
  status: BatteryOptimizerStatus
}

export type BatteryOptimizerLiveInputs = {
  batteryPowerKw: number | null
  batterySocPercent: number | null
  batteryStatus: string
  currentPriceDkkPerKwh: number | null
  gridPowerKw: number | null
  peakRateDays: PeakRateDay[]
  solarForecastWindows: SolarForecastWindow[]
}

export type BatteryOptimizerApiStatusPayload = Partial<{
  batteryPowerKw: number
  estimatedProfitTodayDkk: number
  fullBuyPriceDkkPerKwh: number
  gridPowerKw: number
  mode: BatteryOptimizerMode | string
  recommendation: BatteryOptimizerRecommendation | string
  sellPriceDkkPerKwh: number
  socPercent: number
  spotPriceDkkPerKwh: number
  updatedAt: string
}>

export type BatteryOptimizerApiPlanPayload = Partial<{
  charts: Partial<{
    plannedBatteryPower: unknown
    priceCurve: unknown
    profitByHour: unknown
    socForecast: unknown
  }>
  decisionSummary: Partial<BatteryOptimizerDecisionSummary>
  rows: unknown
  updatedAt: string
}>

export type BatteryOptimizerApiSettingsPayload = Partial<BatteryOptimizerSettings>

export type BatteryOptimizerState = {
  errorMessage: string | null
  hasLiveError: boolean
  isApplyingPlan: boolean
  isEmpty: boolean
  isLoading: boolean
  isPausing: boolean
  isRefreshing: boolean
  isSavingSettings: boolean
  isStale: boolean
  mode: 'direct-api' | 'ha-proxy' | 'mock'
  retry: () => void
  snapshot: BatteryOptimizerSnapshot | null
  updateSetting: <TKey extends keyof BatteryOptimizerSettings>(key: TKey, value: BatteryOptimizerSettings[TKey]) => void
  applyPlan: () => void
  pauseUntilTomorrow: () => void
  refresh: () => void
}

export type BatteryOptimizerPath =
  | '/api/battery/apply-plan'
  | '/api/battery/pause'
  | '/api/battery/plan'
  | '/api/battery/refresh'
  | '/api/battery/settings'
  | '/api/battery/status'

export type BatteryOptimizerClient = {
  applyPlan: (payload: { planRows: BatteryOptimizerPlanRow[]; settings: BatteryOptimizerSettings }) => Promise<void>
  getPlan: () => Promise<BatteryOptimizerApiPlanPayload>
  getSettings: () => Promise<BatteryOptimizerApiSettingsPayload>
  getStatus: () => Promise<BatteryOptimizerApiStatusPayload>
  pauseUntilTomorrow: (payload: { untilIso: string }) => Promise<void>
  refresh: () => Promise<void>
  saveSettings: (payload: BatteryOptimizerSettings) => Promise<void>
}
