import type { PeakRateDay } from './peakRates'
import type { SolarForecastWindow } from './solarForecast'

export type BatteryOptimizerRecommendation = 'BUY' | 'CHARGE' | 'DISCHARGE' | 'HOLD' | 'SELL'
export type BatteryOptimizerMode = 'auto' | 'charge' | 'discharge' | 'export' | 'idle' | 'manual'
export type BatteryOptimizerSource = 'live' | 'mock'

export interface BatteryOptimizerStatus {
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

export interface BatteryOptimizerPlanRow {
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

export interface BatteryOptimizerDecisionSummary {
  avoidBuyHours: string[]
  bestBuyHours: string[]
  bestSellHours: string[]
  evChargingRecommendation: string
  expectedDailyArbitrageProfitDkk: number
  reserveForHouseUsage: string
}

export interface BatteryOptimizerSettings {
  allowBatteryExport: boolean
  allowGridCharging: boolean
  autoMode: boolean
  dryRun: boolean
  maxGridChargeKwh: number
  minReservePercent: number
  pausedUntil: string | null
}

export interface BatteryOptimizerChartSeries {
  labels: string[]
  points: number[]
}

export interface BatteryOptimizerCharts {
  plannedBatteryPower: BatteryOptimizerChartSeries
  priceCurve: BatteryOptimizerChartSeries
  profitByHour: BatteryOptimizerChartSeries
  socForecast: BatteryOptimizerChartSeries
}

export interface BatteryOptimizerSnapshot {
  charts: BatteryOptimizerCharts
  decisionSummary: BatteryOptimizerDecisionSummary
  planRows: BatteryOptimizerPlanRow[]
  settings: BatteryOptimizerSettings
  source: BatteryOptimizerSource
  status: BatteryOptimizerStatus
}

export interface BatteryOptimizerLiveInputs {
  batteryPowerKw: number | null
  batterySocPercent: number | null
  batteryStatus: string
  currentPriceDkkPerKwh: number | null
  gridPowerKw: number | null
  peakRateDays: PeakRateDay[]
  solarForecastWindows: SolarForecastWindow[]
}

export interface BatteryOptimizerMockSnapshotOptions {
  nowMs?: number
  stale?: boolean
}

export interface BatteryOptimizerApiStatusFields {
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
}

export type BatteryOptimizerApiStatusPayload = Partial<BatteryOptimizerApiStatusFields>

export interface BatteryOptimizerApiPlanChartFields {
  plannedBatteryPower: unknown
  priceCurve: unknown
  profitByHour: unknown
  socForecast: unknown
}

export interface BatteryOptimizerApiPlanFields {
  charts: Partial<BatteryOptimizerApiPlanChartFields>
  decisionSummary: Partial<BatteryOptimizerDecisionSummary>
  rows: unknown
  updatedAt: string
}

export type BatteryOptimizerApiPlanPayload = Partial<BatteryOptimizerApiPlanFields>

export interface BatteryOptimizerNormalizedSnapshotPayloads {
  inputs: BatteryOptimizerLiveInputs
  planPayload: BatteryOptimizerApiPlanPayload
  settingsPayload: BatteryOptimizerApiSettingsPayload
  source: BatteryOptimizerSource
  statusPayload: BatteryOptimizerApiStatusPayload
}

export interface BatteryOptimizerApplyPlanPayload {
  planRows: BatteryOptimizerPlanRow[]
  settings: BatteryOptimizerSettings
}

export interface BatteryOptimizerPausePayload {
  untilIso: string
}

export interface BatteryOptimizerClient {
  applyPlan: (payload: BatteryOptimizerApplyPlanPayload) => Promise<void>
  getPlan: () => Promise<BatteryOptimizerApiPlanPayload>
  getSettings: () => Promise<BatteryOptimizerApiSettingsPayload>
  getStatus: () => Promise<BatteryOptimizerApiStatusPayload>
  pauseUntilTomorrow: (payload: BatteryOptimizerPausePayload) => Promise<void>
  refresh: () => Promise<void>
  saveSettings: (payload: BatteryOptimizerSettings) => Promise<void>
}

export type BatteryOptimizerApiSettingsPayload = Partial<BatteryOptimizerSettings>

export interface BatteryOptimizerState {
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
