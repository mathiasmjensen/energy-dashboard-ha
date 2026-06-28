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
  chargePlanTo: string
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
  planFrom: string
  planEndMs: number
  planStatus: string
  planStartMs: number
  planTo: string
  planWindowLabel: string
  priceDayCount: number
  priceHours: EvPlanPriceHour[]
  priceSummary: {
    average: string
    current: string
    peak: string
  }
  safePriceDayIndex: number
  selectedMode: EvccChargeMode
  selectedPriceDay: PeakRateDay
  sessionHistory: EvccChargeSession[]
  setBottomMode: (mode: EvChargerBottomMode) => void
  handleModeChange: (mode: EvccChargeMode) => void
  handleNextPriceDay: () => void
  handlePlanEnabledChange: (enabled: boolean) => void
  handlePlanFromChange: (value: string) => void
  handlePlanToChange: (value: string) => void
  handlePreviousPriceDay: () => void
  handlePriceHourClick: (window: EvPlanPriceHour) => void
  handlePriceHourPointerDown: (window: EvPlanPriceHour) => void
  handlePriceHourPointerEnter: (window: EvPlanPriceHour) => void
  handlePriceHourPointerLeave: () => void
  handlePriceHourPointerUp: () => void
  handleSavePlan: () => void
}
