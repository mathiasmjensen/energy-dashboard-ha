import type { EvccChargeSession } from './evccChargeSessions'
import type { EvccChargeMode } from './evcc'
import type { PeakRateDay, PeakRateHour } from './peakRates'

export type EvPlanPriceHour = PeakRateHour & {
  disabled: boolean
  endMs: number
  index: number
  startMs: number
}

export type EvChargerBottomMode = 'history' | 'plan'

export type UseEvChargerControllerProps = {
  chargeMode: string
  chargeModeOptions: string[]
  chargePlanEnabled: boolean
  chargePlanFrom: string
  chargePlanStartMs: number | null
  chargePlanTo: string
  chargePlanEndMs: number | null
  priceAverage: string
  priceCurrent: string
  priceDays: PeakRateDay[]
  pricePeak: string
  priceSeries: number[]
}

export type EvChargerController = {
  bottomMode: EvChargerBottomMode
  isPlanEnabled: boolean
  modeOptions: Array<{ label: string; value: EvccChargeMode }>
  earliestPlanStartMs: number
  planFrom: string
  planEndMs: number
  haPlanWindowLabel: string
  isPlanPendingConfirmation: boolean
  planStatus: string
  planStartMs: number
  planTo: string
  planWindowLabel: string
  priceHours: EvPlanPriceHour[]
  priceSummary: {
    average: string
    current: string
    peak: string
  }
  nowMs: number
  selectedMode: EvccChargeMode
  selectedPriceDay: PeakRateDay
  sessionHistory: EvccChargeSession[]
  setBottomMode: (mode: EvChargerBottomMode) => void
  handleModeChange: (mode: EvccChargeMode) => void
  handlePlanEnabledChange: (enabled: boolean) => void
  handlePlanFromChange: (value: string) => void
  handlePlanToChange: (value: string) => void
  handlePriceHourClick: (window: EvPlanPriceHour) => void
  handlePriceHourPointerDown: (window: EvPlanPriceHour) => void
  handlePriceHourPointerEnter: (window: EvPlanPriceHour) => void
  handlePriceHourPointerLeave: () => void
  handlePriceHourPointerUp: () => void
  handleSavePlan: () => void
}
