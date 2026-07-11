export type HistoricalEnergyDayDistribution = {
  battery: string
  batteryCharge: string
  batteryDischarge: string
  dataState?: 'live' | 'mock'
  ev: string
  gridExport: string
  gridImport: string
  grid: string
  home: string
  solar: string
}

export type HistoricalEnergyDaySolarProduction = {
  curve: number[]
  dataState?: 'live' | 'mock'
  labels: string[]
  value: string
}

export type HistoricalEnergyDayCacheEntry = {
  available: boolean
  createdAt: number
  source: 'live' | 'mock'
  distribution: HistoricalEnergyDayDistribution
  solarProduction: HistoricalEnergyDaySolarProduction
}
