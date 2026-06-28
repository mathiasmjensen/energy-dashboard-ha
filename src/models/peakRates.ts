export type PeakRateWindow = {
  endMs: number
  price: number
  startMs: number
}

export type PeakRateHour = {
  date: string
  endIso: string
  hour: number
  label: string
  price: number
  startIso: string
}

export type PeakRateDay = {
  average: string | null
  date: string
  label: string
  peak: string | null
  prices: PeakRateHour[]
}

export type PeakRateResult = {
  average: string | null
  days: PeakRateDay[]
  error: boolean
  hourlyPrices: number[]
  peak: string | null
  peakLabel: string
  now: string | null
  windows: PeakRateWindow[]
}
