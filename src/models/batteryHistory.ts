export type BatteryHistoryPeriod = '24h' | '30d' | '7d' | '90d'

export type BatteryHistorySeries = {
  labels: string[]
  points: number[]
}

export type BatteryHistoryState = {
  changedMs: number
  value: number
}
